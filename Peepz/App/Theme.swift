import SwiftUI

/// Peepz brand colours and fonts, from the project brief.
enum Theme {
    static let pink = Color(hex: 0xFF5C8A)
    static let lime = Color(hex: 0xC6F24E)
    static let sky = Color(hex: 0x7CC7FF)
    static let lilac = Color(hex: 0xB79CFF)
    static let ink = Color(hex: 0x12121A)
    static let background = Color.white
    static let softGrey = Color(hex: 0xF3F2F6)
    static let midGrey = Color(hex: 0x8A8A96)

    /// Space Grotesk for app screens.
    static func font(_ size: CGFloat, _ weight: Weight = .regular) -> Font {
        let name: String
        switch weight {
        case .regular: name = "SpaceGrotesk-Regular"
        case .medium: name = "SpaceGrotesk-Medium"
        case .bold: name = "SpaceGrotesk-Bold"
        }
        return .custom(name, size: size)
    }

    /// Titan One, the chunky "PeepZ" wordmark font.
    static func wordmark(_ size: CGFloat) -> Font {
        .custom("TitanOne", size: size)
    }

    /// Fredoka for big playful headings.
    static func display(_ size: CGFloat) -> Font {
        .custom("Fredoka-Bold", size: size)
    }

    enum Weight { case regular, medium, bold }
}

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}

/// Big rounded pink call-to-action button.
struct PrimaryButtonStyle: ButtonStyle {
    var enabled: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Theme.font(18, .bold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(enabled ? Theme.pink : Theme.midGrey.opacity(0.5))
            )
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: configuration.isPressed)
    }
}
