import SwiftUI

/// A status bubble with a little tail pointing down at the person.
struct BubbleView: View {
    let bubble: Bubble
    var isPromo: Bool = false
    var isFriend: Bool = false
    var distance: Float? = nil
    var placeholder: String = "Your status"

    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 4) {
                if isPromo || isFriend || distance != nil {
                    HStack(spacing: 6) {
                        if isPromo { tag("PROMO", fill: Theme.ink, text: .white) }
                        if isFriend { tag("FRIEND", fill: Theme.sky, text: Theme.ink) }
                        if let distance { tag(Self.format(distance), fill: Theme.ink.opacity(0.12), text: bubble.color.text) }
                    }
                }
                HStack(spacing: 8) {
                    Text(bubble.emoji).font(.system(size: 24))
                    Text(bubble.isEmpty ? placeholder : bubble.text)
                        .font(Theme.font(17, .bold))
                        .foregroundStyle(bubble.color.text.opacity(bubble.isEmpty ? 0.5 : 1))
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(maxWidth: 240, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(bubble.color.fill)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(Theme.ink.opacity(bubble.color == .white ? 0.12 : 0), lineWidth: 1)
            )

            BubbleTail()
                .fill(bubble.color.fill)
                .frame(width: 22, height: 12)
        }
        .fixedSize()
        .shadow(color: .black.opacity(0.18), radius: 10, y: 4)
    }

    private func tag(_ text: String, fill: Color, text color: Color) -> some View {
        Text(text)
            .font(Theme.font(10, .bold))
            .tracking(0.6)
            .foregroundStyle(color)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(Capsule().fill(fill))
    }

    static func format(_ metres: Float) -> String {
        metres < 10 ? String(format: "%.1f m", metres) : "\(Int(metres.rounded())) m"
    }
}

struct BubbleTail: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addQuadCurve(to: CGPoint(x: rect.midX, y: rect.maxY),
                          control: CGPoint(x: rect.midX - 2, y: rect.minY + 2))
        path.addQuadCurve(to: CGPoint(x: rect.maxX, y: rect.minY),
                          control: CGPoint(x: rect.midX + 2, y: rect.minY + 2))
        path.closeSubpath()
        return path
    }
}

/// The persistent dot that shows who can currently see you.
struct VisibilityDot: View {
    let visibility: PeepVisibility
    var size: CGFloat = 10

    var body: some View {
        Circle()
            .fill(visibility.dotColor)
            .frame(width: size, height: size)
            .overlay(Circle().stroke(.white, lineWidth: 2))
    }
}

#Preview {
    VStack(spacing: 30) {
        BubbleView(bubble: Bubble.presets[0], distance: 2.4)
        BubbleView(bubble: Bubble.presets[2], isFriend: true)
        BubbleView(bubble: Bubble(text: "2-for-1 cocktails", emoji: "🍹", color: .white), isPromo: true)
    }
    .padding()
    .background(Theme.softGrey)
}
