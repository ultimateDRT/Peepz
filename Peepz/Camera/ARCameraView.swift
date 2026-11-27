import SwiftUI
import ARKit
import RealityKit
import Combine
import simd
import Vision

/// Where to draw one bubble on screen this frame.
struct Placement: Equatable {
    var peep: NearbyPeep
    var point: CGPoint
    var scale: CGFloat
    var distance: Float?
    /// True when the bubble was snapped above a person seen by the camera.
    var onHead = false
}

/// What the camera screen should show, updated about 30 times a second by the AR view.
/// Kept separate from the rest of the screen so only the bubbles redraw every frame.
@Observable
final class BubbleLayout {
    /// Bubbles pinned to a person who is in front of the camera.
    var placements: [String: Placement] = [:]
    /// People nearby whose position isn't known yet. Shown in a tray, never floating in the scene.
    var unlocated: [NearbyPeep] = []
    /// Everyone nearby, on screen or not.
    var nearbyCount: Int = 0
    /// Diagnostics panel (long-press the "nearby" pill to toggle).
    var showDebug = false
    var debugLines: [String] = []
}

/// The live camera, with ARKit world tracking so bubbles stay pinned in space as you move.
struct ARCameraView: UIViewRepresentable {
    let layout: BubbleLayout
    /// Called every frame to get the current people. Reading app state here does not redraw SwiftUI.
    let peeps: () -> [NearbyPeep]
    let onSessionReady: (ARSession) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(layout: layout, peeps: peeps) }

    func makeUIView(context: Context) -> ARView {
        let view = ARView(frame: .zero, cameraMode: .ar, automaticallyConfigureSession: false)
        // Nothing 3D is drawn, so switch off every effect we can to save battery and frame time.
        view.renderOptions = [
            .disableMotionBlur, .disableDepthOfField, .disableHDR,
            .disableGroundingShadows, .disablePersonOcclusion, .disableAREnvironmentLighting,
            .disableCameraGrain,
        ]

        // These settings are what Nearby Interaction needs to share this session for camera assistance.
        let config = ARWorldTrackingConfiguration()
        config.worldAlignment = .gravity
        config.isCollaborationEnabled = false
        config.userFaceTrackingEnabled = false
        config.initialWorldMap = nil
        view.session.run(config)

        // Nearby Interaction camera assistance requires a delegate that refuses relocalization.
        view.session.delegate = context.coordinator
        context.coordinator.attach(view)
        let session = view.session
        DispatchQueue.main.async { onSessionReady(session) }
        return view
    }

    func updateUIView(_ view: ARView, context: Context) {}

    static func dismantleUIView(_ view: ARView, coordinator: Coordinator) {
        coordinator.detach()
        view.session.pause()
    }

    final class Coordinator: NSObject, ARSessionDelegate {
        let layout: BubbleLayout
        let peeps: () -> [NearbyPeep]
        private weak var view: ARView?
        private var updateSubscription: Cancellable?
        private var lastTick: TimeInterval = 0
        private var lastRemoteLog: TimeInterval = 0

        // Person detection, used to lift a bubble from someone's phone to above their head.
        // Finds human shapes only. It does not recognise who anyone is.
        private let visionQueue = DispatchQueue(label: "peepz.people", qos: .userInitiated)
        private var visionBusy = false
        private var lastVision: TimeInterval = 0
        /// Bodies seen in the last camera image, in screen points, and when.
        private var bodies: [CGRect] = []
        private var bodiesAt: TimeInterval = 0
        /// Smoothed head positions so bubbles don't jitter, by person ID.
        private var smoothed: [String: CGPoint] = [:]

        /// How far above someone's phone their head usually is, in metres.
        static let phoneToHead: Float = 0.45

        /// A measured position older than this is not trusted (the person may have moved).
        static let maxFixAge: TimeInterval = 4

        init(layout: BubbleLayout, peeps: @escaping () -> [NearbyPeep]) {
            self.layout = layout
            self.peeps = peeps
            super.init()
        }

        func sessionShouldAttemptRelocalization(_ session: ARSession) -> Bool { false }

        func attach(_ view: ARView) {
            self.view = view
            updateSubscription = view.scene.subscribe(to: SceneEvents.Update.self) { [weak self] _ in
                self?.tick()
            }
        }

        func detach() {
            updateSubscription?.cancel()
            updateSubscription = nil
        }

        private func tick() {
            guard let view, let frame = view.session.currentFrame else { return }
            let now = CACurrentMediaTime()
            guard now - lastTick > 1.0 / 30.0 else { return }
            lastTick = now

            let size = view.bounds.size
            let cameraTransform = frame.camera.transform
            let cameraPosition = SIMD3<Float>(cameraTransform.columns.3.x, cameraTransform.columns.3.y, cameraTransform.columns.3.z)
            let worldToCamera = cameraTransform.inverse
            let current = peeps()

            let focal = pointsPerMetre(frame: frame, size: size)
            var placements: [String: Placement] = [:]
            var unlocated: [NearbyPeep] = []

            for (index, peep) in current.enumerated() {
                let fixIsFresh = peep.isSimulated || (peep.worldFixAt.map { -$0.timeIntervalSinceNow < Self.maxFixAge } ?? false)

                if fixIsFresh, var world = peep.worldPosition {
                    // Pinned in 3D: shown only when they're in front of the camera.
                    if peep.isSimulated {
                        world.y += Float(sin(now * 1.4 + Double(index))) * 0.03
                    } else {
                        // Nearby Interaction gives the position of their *phone*. Their head is roughly this far above it.
                        world.y += Self.phoneToHead
                    }
                    let inCamera = worldToCamera * SIMD4<Float>(world.x, world.y, world.z, 1)
                    guard inCamera.z < -0.2, let point = view.project(world),
                          point.x > -80, point.x < size.width + 80, point.y > -80, point.y < size.height + 80
                    else { continue } // behind you or off screen: no bubble
                    let distance = peep.distance ?? simd_distance(world, cameraPosition)
                    placements[peep.id] = Placement(peep: peep, point: Self.round(point), scale: Self.scale(for: distance), distance: distance)

                } else if let direction = peep.direction, let distance = peep.distance {
                    // No 3D position, but the UWB chip can see their phone in front of yours.
                    // Direction only exists while they're roughly in front, so facing away hides the bubble.
                    // Direction is in your phone's axes: x right, y up, -z straight out of the back camera.
                    // Project it like the camera would (pinhole model) so it lines up with the picture.
                    let forward = max(-direction.z, 0.2)
                    let x = size.width / 2 + focal * CGFloat(direction.x / forward)
                    let y = size.height / 2 - focal * CGFloat(direction.y / forward)
                    placements[peep.id] = Placement(peep: peep, point: Self.round(CGPoint(x: x, y: y)),
                                                    scale: Self.scale(for: distance), distance: distance)

                } else if !peep.isSimulated {
                    unlocated.append(peep)
                }
            }

            let sendRemote = now - lastRemoteLog > 5 && current.contains { !$0.isSimulated }
            detectPeopleIfDue(frame: frame, now: now, size: size)
            for (id, place) in placements where !place.peep.isSimulated {
                var target = place.point
                var snapped = false
                if now - bodiesAt < 0.6, let body = Self.body(near: place.point, in: bodies) {
                    // Bubble's tail sits just above the top of their head.
                    target = CGPoint(x: body.midX, y: body.minY - 6)
                    snapped = true
                }
                if !snapped, place.peep.worldPosition == nil || !(place.peep.worldFixAt.map { -$0.timeIntervalSinceNow < Self.maxFixAge } ?? false),
                   let d = place.distance {
                    // Screen position came from the phone's direction, so lift it by a head's height.
                    target.y -= focal * CGFloat(Self.phoneToHead / max(d, 0.3))
                }
                let previous = smoothed[id] ?? target
                let point = CGPoint(x: previous.x + (target.x - previous.x) * 0.35,
                                    y: previous.y + (target.y - previous.y) * 0.35)
                smoothed[id] = point
                placements[id]?.point = Self.round(point)
                placements[id]?.onHead = snapped
            }
            smoothed = smoothed.filter { placements[$0.key] != nil }

            if layout.showDebug || sendRemote {
                var lines: [String] = ["AR tracking: \(Self.describe(frame.camera.trackingState)) · bodies \(now - bodiesAt < 0.6 ? bodies.count : 0)"]
                for peep in current where !peep.isSimulated {
                    let d = peep.distance.map { String(format: "%.2f m", $0) } ?? "no distance"
                    let dir = peep.direction.map { String(format: "dir x%.2f y%.2f z%.2f", $0.x, $0.y, $0.z) } ?? "no direction"
                    let age = peep.worldFixAt.map { String(format: "3D fix %.1fs ago", -$0.timeIntervalSinceNow) } ?? "no 3D fix"
                    var onScreen = "hidden"
                    if let p = placements[peep.id] { onScreen = "drawn at \(Int(p.point.x)),\(Int(p.point.y))\(p.onHead ? " on head" : "")" }
                    lines.append("\(peep.bubble.emoji) \(d) · \(dir) · \(age) · assist \(peep.cameraAssisted ? "on" : "off") · \(peep.convergence) · updates \(peep.updates) · \(onScreen)")
                }
                if layout.showDebug, lines != layout.debugLines { layout.debugLines = lines }
                if sendRemote {
                    lastRemoteLog = now
                    RemoteLog.send(lines.joined(separator: " | "))
                }
            }

            if placements != layout.placements { layout.placements = placements }
            if unlocated != layout.unlocated { layout.unlocated = unlocated }
            if current.count != layout.nearbyCount { layout.nearbyCount = current.count }
        }

        /// Run person detection about five times a second, off the main thread.
        private func detectPeopleIfDue(frame: ARFrame, now: TimeInterval, size: CGSize) {
            guard !visionBusy, now - lastVision > 0.2,
                  peeps().contains(where: { !$0.isSimulated }) else { return }
            visionBusy = true
            lastVision = now
            let pixels = frame.capturedImage
            let imageSize = CGSize(width: CVPixelBufferGetHeight(pixels), height: CVPixelBufferGetWidth(pixels)) // upright
            visionQueue.async { [weak self] in
                let request = VNDetectHumanRectanglesRequest()
                request.upperBodyOnly = false
                // Back camera image is landscape; .right turns it upright for a phone held in portrait.
                let handler = VNImageRequestHandler(cvPixelBuffer: pixels, orientation: .right)
                try? handler.perform([request])
                let found = (request.results ?? []).filter { $0.confidence > 0.3 }.map {
                    Self.toScreen($0.boundingBox, imageSize: imageSize, viewSize: size)
                }
                DispatchQueue.main.async {
                    guard let self else { return }
                    self.bodies = found
                    self.bodiesAt = CACurrentMediaTime()
                    self.visionBusy = false
                }
            }
        }

        /// Vision's box (0–1, origin bottom-left, upright image) to screen points.
        /// The camera image fills the screen and is cropped at the sides, like aspect-fill.
        static func toScreen(_ box: CGRect, imageSize: CGSize, viewSize: CGSize) -> CGRect {
            let scale = max(viewSize.width / imageSize.width, viewSize.height / imageSize.height)
            let shownW = imageSize.width * scale, shownH = imageSize.height * scale
            let offX = (shownW - viewSize.width) / 2, offY = (shownH - viewSize.height) / 2
            return CGRect(x: box.minX * shownW - offX,
                          y: (1 - box.maxY) * shownH - offY,
                          width: box.width * shownW,
                          height: box.height * shownH)
        }

        /// The body whose outline contains, or is closest to, the point where their phone is.
        static func body(near point: CGPoint, in bodies: [CGRect]) -> CGRect? {
            bodies
                .filter { $0.insetBy(dx: -$0.width * 0.25, dy: -$0.height * 0.1).contains(point) }
                .min { abs($0.midX - point.x) < abs($1.midX - point.x) }
        }

        /// Roughly how many screen points one metre covers at one metre away, from the camera's focal length.
        private func pointsPerMetre(frame: ARFrame, size: CGSize) -> CGFloat {
            let pixels = frame.camera.imageResolution // landscape
            let upright = CGSize(width: pixels.height, height: pixels.width)
            let scale = max(size.width / upright.width, size.height / upright.height)
            return CGFloat(frame.camera.intrinsics[0][0]) * scale
        }

        static func describe(_ state: ARCamera.TrackingState) -> String {
            switch state {
            case .normal: return "normal"
            case .notAvailable: return "not available"
            case .limited(let reason): return "limited (\(reason))"
            }
        }

        static func scale(for distance: Float) -> CGFloat {
            CGFloat(min(max(2.2 / max(distance, 0.1), 0.55), 1.1))
        }

        static func round(_ p: CGPoint) -> CGPoint {
            CGPoint(x: p.x.rounded(), y: p.y.rounded())
        }
    }
}
