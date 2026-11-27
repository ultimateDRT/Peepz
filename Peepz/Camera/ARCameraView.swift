import SwiftUI
import ARKit
import RealityKit
import Combine
import simd

/// Where to draw one bubble on screen this frame.
struct Placement: Equatable {
    var peep: NearbyPeep
    var point: CGPoint
    var scale: CGFloat
    var distance: Float?
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

    final class Coordinator {
        let layout: BubbleLayout
        let peeps: () -> [NearbyPeep]
        private weak var view: ARView?
        private var updateSubscription: Cancellable?
        private var lastTick: TimeInterval = 0

        /// A measured position older than this is not trusted (the person may have moved).
        static let maxFixAge: TimeInterval = 4

        init(layout: BubbleLayout, peeps: @escaping () -> [NearbyPeep]) {
            self.layout = layout
            self.peeps = peeps
        }

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

            var placements: [String: Placement] = [:]
            var unlocated: [NearbyPeep] = []

            for (index, peep) in current.enumerated() {
                let fixIsFresh = peep.isSimulated || (peep.worldFixAt.map { -$0.timeIntervalSinceNow < Self.maxFixAge } ?? false)

                if fixIsFresh, var world = peep.worldPosition {
                    // Pinned in 3D: shown only when they're in front of the camera.
                    if peep.isSimulated {
                        world.y += Float(sin(now * 1.4 + Double(index))) * 0.03
                    } else {
                        // Nearby Interaction gives the position of their *phone*. Float the bubble just above it.
                        world.y += 0.25
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
                    // x is to the right of your phone; spread it across the screen.
                    let x = size.width / 2 + CGFloat(direction.x) * size.width * 0.9
                    let y = size.height * 0.4 - CGFloat(direction.y) * size.height * 0.6
                    placements[peep.id] = Placement(peep: peep, point: Self.round(CGPoint(x: x, y: y)),
                                                    scale: Self.scale(for: distance), distance: distance)

                } else if !peep.isSimulated {
                    unlocated.append(peep)
                }
            }

            if placements != layout.placements { layout.placements = placements }
            if unlocated != layout.unlocated { layout.unlocated = unlocated }
            if current.count != layout.nearbyCount { layout.nearbyCount = current.count }
        }

        static func scale(for distance: Float) -> CGFloat {
            CGFloat(min(max(2.2 / max(distance, 0.1), 0.55), 1.1))
        }

        static func round(_ p: CGPoint) -> CGPoint {
            CGPoint(x: p.x.rounded(), y: p.y.rounded())
        }
    }
}
