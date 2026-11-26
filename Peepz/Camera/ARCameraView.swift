import SwiftUI
import ARKit
import RealityKit
import Combine
import simd

/// Where to draw one bubble on screen this frame.
struct Placement: Equatable {
    var point: CGPoint
    var scale: CGFloat
    var distance: Float?
}

/// Screen positions of every bubble, updated about 30 times a second by the AR view.
@Observable
final class BubbleLayout {
    var placements: [String: Placement] = [:]
}

/// The live camera, with ARKit world tracking so bubbles stay pinned in space as you move.
struct ARCameraView: UIViewRepresentable {
    var peeps: [NearbyPeep]
    let layout: BubbleLayout
    let onSessionReady: (ARSession) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(layout: layout) }

    func makeUIView(context: Context) -> ARView {
        let view = ARView(frame: .zero, cameraMode: .ar, automaticallyConfigureSession: false)
        view.renderOptions = [.disableMotionBlur, .disableDepthOfField]

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

    func updateUIView(_ view: ARView, context: Context) {
        context.coordinator.peeps = peeps
    }

    static func dismantleUIView(_ view: ARView, coordinator: Coordinator) {
        coordinator.detach()
        view.session.pause()
    }

    final class Coordinator {
        let layout: BubbleLayout
        var peeps: [NearbyPeep] = []
        private weak var view: ARView?
        private var updateSubscription: Cancellable?
        private var lastTick: TimeInterval = 0

        init(layout: BubbleLayout) {
            self.layout = layout
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

            var result: [String: Placement] = [:]
            var unplaced: [NearbyPeep] = []

            for (index, peep) in peeps.enumerated() {
                if var world = peep.worldPosition {
                    if peep.isSimulated {
                        // Gentle bob so demo bubbles feel alive.
                        world.y += Float(sin(now * 1.4 + Double(index))) * 0.03
                    } else {
                        // Nearby Interaction gives the position of their *phone* (hand or chest height).
                        // GUESS: lift the bubble ~45 cm so it sits above their head. Tune on device.
                        world.y += 0.45
                    }
                    let inCamera = worldToCamera * SIMD4<Float>(world.x, world.y, world.z, 1)
                    guard inCamera.z < -0.2 else { continue } // behind you
                    guard let point = view.project(world) else { continue }
                    let distance = peep.distance ?? simd_distance(world, cameraPosition)
                    result[peep.id] = Placement(point: point, scale: Self.scale(for: distance), distance: distance)
                } else if let direction = peep.direction, let distance = peep.distance {
                    // No AR position, but the UWB chip knows the direction (x = right, y = up from the phone).
                    let x = size.width / 2 + CGFloat(direction.x) * size.width * 0.8
                    let y = size.height * 0.32 - CGFloat(direction.y) * size.height * 0.5
                    result[peep.id] = Placement(point: CGPoint(x: x, y: y), scale: Self.scale(for: distance), distance: distance)
                } else {
                    unplaced.append(peep)
                }
            }

            // People we can't locate yet (older iPhones, or still measuring): show them in a row near the top.
            for (i, peep) in unplaced.enumerated() {
                let x = size.width * (CGFloat(i) + 0.5) / CGFloat(max(unplaced.count, 1))
                let y = size.height * 0.24 + CGFloat(i % 2) * 80
                result[peep.id] = Placement(point: CGPoint(x: x, y: y), scale: 0.75, distance: peep.distance)
            }

            if result != layout.placements {
                layout.placements = result
            }
        }

        static func scale(for distance: Float) -> CGFloat {
            CGFloat(min(max(2.2 / max(distance, 0.1), 0.55), 1.1))
        }
    }
}
