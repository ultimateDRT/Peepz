import Foundation
import simd

/// Pretend people for demo mode, so Peepz can be tried with a single phone.
/// Positions are in metres in the AR world, relative to where the phone was when the camera opened:
/// x = right, y = up, negative z = straight ahead. Some are behind you, so turn around.
enum SimulatedCrowd {
    static let peeps: [NearbyPeep] = [
        NearbyPeep(id: "sim-1", bubble: Bubble(text: "Single and looking", emoji: "💘", color: .pink),
                   isSimulated: true, worldPosition: SIMD3(-1.1, 0.35, -2.8)),
        NearbyPeep(id: "sim-2", bubble: Bubble(text: "Ask me about my band", emoji: "🎸", color: .lime),
                   isSimulated: true, worldPosition: SIMD3(0.9, 0.3, -2.0)),
        NearbyPeep(id: "sim-3", bubble: Bubble(text: "Bored. Entertain me", emoji: "🥱", color: .lilac),
                   isSimulated: true, worldPosition: SIMD3(2.6, 0.45, -4.6)),
        NearbyPeep(id: "sim-4", bubble: Bubble(text: "2-for-1 cocktails at the bar", emoji: "🍹", color: .white),
                   isPromo: true, isSimulated: true, worldPosition: SIMD3(-2.4, 0.6, -5.5)),
        NearbyPeep(id: "sim-5", bubble: Bubble(text: "Open to networking", emoji: "🤝", color: .sky),
                   isSimulated: true, worldPosition: SIMD3(0.2, 0.4, 3.0)),
        NearbyPeep(id: "sim-6", bubble: Bubble(text: "First time here!", emoji: "🎉", color: .lime),
                   isSimulated: true, worldPosition: SIMD3(-2.5, 0.3, 1.5)),
    ]
}
