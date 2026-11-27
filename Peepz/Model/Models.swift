import SwiftUI
import simd

/// Who can see your bubble. Defaults to hidden.
enum PeepVisibility: String, CaseIterable, Codable, Identifiable {
    case hidden, friends, everyone

    var id: String { rawValue }

    var title: String {
        switch self {
        case .hidden: return "Hidden"
        case .friends: return "Friends"
        case .everyone: return "Everyone"
        }
    }

    var subtitle: String {
        switch self {
        case .hidden: return "Nobody sees your bubble. You can still look around."
        case .friends: return "Only people you've added as friends see your bubble."
        case .everyone: return "Anyone nearby using Peepz sees your bubble."
        }
    }

    var symbol: String {
        switch self {
        case .hidden: return "eye.slash.fill"
        case .friends: return "person.2.fill"
        case .everyone: return "globe"
        }
    }

    /// Colour of the small persistent dot that shows who can currently see you.
    var dotColor: Color {
        switch self {
        case .hidden: return Theme.midGrey
        case .friends: return Theme.sky
        case .everyone: return Theme.lime
        }
    }
}

enum BubbleColor: String, CaseIterable, Codable, Identifiable {
    case pink, lime, sky, lilac, white

    var id: String { rawValue }

    var fill: Color {
        switch self {
        case .pink: return Theme.pink
        case .lime: return Theme.lime
        case .sky: return Theme.sky
        case .lilac: return Theme.lilac
        case .white: return .white
        }
    }

    var text: Color {
        switch self {
        case .pink: return .white
        default: return Theme.ink
        }
    }
}

/// A status bubble: short text, an emoji and a colour.
/// The look of a bubble. Everyone sees the shape its owner picked.
enum BubbleShape: String, CaseIterable, Codable, Identifiable {
    case sticker, candy, ink, glass, nameTag, halo, cloud, speech, burst, crush

    var id: String { rawValue }

    var title: String {
        switch self {
        case .sticker: return "Sticker"
        case .candy: return "Candy"
        case .ink: return "Ink"
        case .glass: return "Glass"
        case .nameTag: return "Name tag"
        case .halo: return "Halo"
        case .cloud: return "Cloud"
        case .speech: return "Speech"
        case .burst: return "Burst"
        case .crush: return "Crush"
        }
    }
}

struct Bubble: Codable, Equatable {
    var text: String
    var emoji: String
    var color: BubbleColor
    var shape: BubbleShape = .sticker

    init(text: String, emoji: String, color: BubbleColor, shape: BubbleShape = .sticker) {
        self.text = text
        self.emoji = emoji
        self.color = color
        self.shape = shape
    }

    // Bubbles saved, or sent by phones, from before shapes existed have no shape: use Sticker.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        text = try c.decode(String.self, forKey: .text)
        emoji = try c.decode(String.self, forKey: .emoji)
        color = try c.decode(BubbleColor.self, forKey: .color)
        shape = (try? c.decodeIfPresent(BubbleShape.self, forKey: .shape)) ?? .sticker
    }

    static let maxLength = 40

    static let empty = Bubble(text: "", emoji: "👋", color: .pink)

    static let presets: [Bubble] = [
        Bubble(text: "Single and looking", emoji: "💘", color: .pink),
        Bubble(text: "Bored", emoji: "🥱", color: .lilac),
        Bubble(text: "Ask me about my band", emoji: "🎸", color: .lime),
        Bubble(text: "New here, say hi", emoji: "👋", color: .sky),
        Bubble(text: "Open to networking", emoji: "🤝", color: .white),
    ]

    static let emojiChoices = ["👋", "💘", "🥱", "🎸", "🤝", "🎉", "☕️", "🔥", "😎", "🍕", "📚", "🎧"]

    var isEmpty: Bool { text.trimmingCharacters(in: .whitespaces).isEmpty }
}

/// Another person near you, either real (found over the local network) or simulated for demos.
struct NearbyPeep: Identifiable, Equatable {
    let id: String
    var bubble: Bubble
    var isPromo: Bool = false
    var isSimulated: Bool = false
    var isFriend: Bool = false
    /// Distance in metres, if the phone can measure it.
    var distance: Float?
    /// Unit vector towards the person in the phone's own frame (Nearby Interaction), if known.
    var direction: SIMD3<Float>?
    /// Where the bubble should float in the AR world, if known.
    var worldPosition: SIMD3<Float>?
    /// When `worldPosition` was last measured. Old fixes are ignored so bubbles don't hang in mid-air.
    var worldFixAt: Date?
    /// Tip for the user while the phone is still working out where this person is.
    var coaching: String?
    /// Diagnostics: is camera assistance on for this person, and Apple's last convergence status.
    var cameraAssisted: Bool = false
    var convergence: String = "–"
    var updates: Int = 0
    /// Heard over Bluetooth only (their Peepz may be closed): no distance or direction.
    var isApproximate = false
    /// Bluetooth signal strength in dBm, when heard over Bluetooth.
    var signal: Int?
}

/// Very small first-pass text filter. Real moderation comes later (see README).
enum TextFilter {
    // Placeholder list. Swap for a proper moderation service before any public launch.
    private static let blocked = ["fuck", "cunt", "kill yourself", "kys"]

    static func isAllowed(_ text: String) -> Bool {
        let lower = text.lowercased()
        return !blocked.contains { lower.contains($0) }
    }
}
