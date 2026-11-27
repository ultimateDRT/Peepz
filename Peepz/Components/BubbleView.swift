import SwiftUI

/// A status bubble in its owner's chosen shape, with a pointer down to the person.
/// The bottom centre of the view is the tip of the pointer.
struct BubbleView: View {
    let bubble: Bubble
    var isPromo: Bool = false
    var isFriend: Bool = false
    var distance: Float? = nil
    var placeholder: String = "Your status"

    /// Past this many metres only the emoji shows, so a crowd doesn't become a wall of text.
    static let emojiOnlyBeyond: Float = 5

    private var compact: Bool { (distance ?? 0) > Self.emojiOnlyBeyond }
    private var c: Color { bubble.color == .white ? Theme.ink.opacity(0.35) : bubble.color.fill }
    private var ct: Color { bubble.color == .white ? .white : bubble.color.text }
    private var status: String { bubble.isEmpty ? placeholder : bubble.text }
    private var statusOpacity: Double { bubble.isEmpty ? 0.5 : 1 }

    var body: some View {
        VStack(spacing: 4) {
            if !compact && (isPromo || isFriend || distance != nil) {
                HStack(spacing: 5) {
                    if isPromo { tag("PROMO", fill: Theme.ink, text: .white) }
                    if isFriend { tag("FRIEND", fill: Theme.sky, text: Theme.ink) }
                    if let distance { tag(Self.format(distance), fill: .black.opacity(0.55), text: .white) }
                }
            }
            shaped
        }
        .fixedSize()
    }

    @ViewBuilder private var shaped: some View {
        switch bubble.shape {
        case .sticker: sticker
        case .candy: candy
        case .ink: ink
        case .glass: glass
        case .nameTag: nameTag
        case .halo: halo
        case .cloud: cloud
        case .speech: speech
        case .burst: burst
        case .crush: crush
        }
    }

    // MARK: Pieces

    private func statusText(_ font: Font, _ color: Color) -> some View {
        Text(status)
            .font(font)
            .foregroundStyle(color.opacity(statusOpacity))
            .lineLimit(2)
            .multilineTextAlignment(.leading)
            .frame(maxWidth: 220, alignment: .leading)
            .fixedSize(horizontal: false, vertical: true)
    }

    private func content(emojiSize: CGFloat = 19, font: Font = Theme.font(15, .bold), color: Color) -> some View {
        HStack(spacing: 7) {
            Text(bubble.emoji).font(.system(size: emojiSize))
            if !compact { statusText(font, color) }
        }
    }

    private func emojiDot(_ size: CGFloat) -> some View {
        Text(bubble.emoji)
            .font(.system(size: size * 0.56))
            .frame(width: size, height: size)
            .background(Circle().fill(c))
    }

    private var fredoka: Font { Theme.display(16) }

    // MARK: Shapes

    private var sticker: some View {
        VStack(spacing: -1) {
            content(emojiSize: 22, font: fredoka, color: Theme.ink)
                .padding(.horizontal, compact ? 9 : 15)
                .padding(.vertical, compact ? 6 : 9)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(.white)
                        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(c).offset(x: 4, y: 4))
                )
                .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(Theme.ink, lineWidth: 3))
            ZStack(alignment: .top) {
                Triangle().fill(Theme.ink).frame(width: 22, height: 11)
                Triangle().fill(.white).frame(width: 12, height: 6)
            }
        }
        .rotationEffect(.degrees(-3), anchor: .bottom)
    }

    private var candy: some View {
        VStack(spacing: -1) {
            content(color: ct)
                .padding(.horizontal, compact ? 10 : 16)
                .padding(.vertical, compact ? 7 : 10)
                .background(Capsule().fill(c))
            Triangle().fill(c).frame(width: 16, height: 8)
        }
        .shadow(color: .black.opacity(0.28), radius: 8, y: 6)
    }

    private var ink: some View {
        let dark = Theme.ink.opacity(0.92)
        return VStack(spacing: -1) {
            HStack(spacing: 8) {
                emojiDot(32)
                if !compact { statusText(Theme.font(15, .bold), .white) }
            }
            .padding(.leading, compact ? 4 : 9)
            .padding(.trailing, compact ? 4 : 15)
            .padding(.vertical, compact ? 4 : 9)
            .background(Capsule().fill(dark))
            Triangle().fill(dark).frame(width: 14, height: 7)
        }
        .shadow(color: .black.opacity(0.3), radius: 8, y: 6)
    }

    private var glass: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                emojiDot(30)
                if !compact { statusText(Theme.font(15, .bold), Theme.ink) }
            }
            .padding(.leading, compact ? 5 : 8)
            .padding(.trailing, compact ? 5 : 14)
            .padding(.vertical, compact ? 5 : 8)
            .background(RoundedRectangle(cornerRadius: 20, style: .continuous).fill(.ultraThinMaterial))
            .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(.white.opacity(0.75), lineWidth: 1))
            Rectangle().fill(.white.opacity(0.8)).frame(width: 2, height: 10)
        }
        .environment(\.colorScheme, .light)
        .shadow(color: .black.opacity(0.18), radius: 11, y: 8)
    }

    private var nameTag: some View {
        VStack(spacing: 0) {
            VStack(spacing: 0) {
                if compact {
                    Rectangle().fill(c).frame(height: 6)
                } else {
                    Text("HELLO")
                        .font(Theme.display(11))
                        .tracking(1.3)
                        .foregroundStyle(ct)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 5)
                        .background(c)
                }
                content(color: Theme.ink)
                    .padding(.horizontal, compact ? 8 : 12)
                    .padding(.vertical, compact ? 5 : 8)
            }
            .frame(minWidth: compact ? 0 : 150)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            Rectangle().fill(.white).frame(width: 2, height: 10)
        }
        .shadow(color: .black.opacity(0.28), radius: 8, y: 6)
    }

    private var halo: some View {
        VStack(spacing: 6) {
            if !compact {
                Text(status)
                    .font(Theme.font(13, .medium))
                    .foregroundStyle(.white.opacity(statusOpacity))
                    .lineLimit(2)
                    .frame(maxWidth: 200)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Theme.ink.opacity(0.82)))
            }
            Text(bubble.emoji)
                .font(.system(size: 23))
                .frame(width: 44, height: 44)
                .background(Circle().fill(.white))
                .overlay(Circle().stroke(c, lineWidth: 3))
                .shadow(color: .black.opacity(0.3), radius: 7, y: 6)
            Circle().fill(c).frame(width: 4, height: 4)
                .background(Circle().fill(.white.opacity(0.7)).frame(width: 10, height: 10))
        }
    }

    private var cloud: some View {
        VStack(spacing: 2) {
            content(font: fredoka, color: Theme.ink)
                .padding(.horizontal, compact ? 12 : 18)
                .padding(.vertical, compact ? 8 : 12)
                .background(
                    ZStack(alignment: .top) {
                        GeometryReader { g in
                            let w = g.size.width
                            ForEach(Array([(0.20, 18.0), (0.40, 26.0), (0.62, 22.0), (0.82, 16.0)].enumerated()), id: \.offset) { _, puff in
                                Circle().fill(.white)
                                    .frame(width: puff.1 * 2, height: puff.1 * 2)
                                    .position(x: w * puff.0, y: 10)
                            }
                        }
                        Capsule().fill(.white)
                    }
                )
                .shadow(color: c.opacity(0.6), radius: 9, y: 8)
            Circle().fill(.white).frame(width: 11, height: 11)
            Circle().fill(.white).frame(width: 6, height: 6).offset(x: -6)
        }
    }

    private var speech: some View {
        VStack(spacing: -3) {
            content(font: fredoka, color: Theme.ink)
                .padding(.horizontal, compact ? 9 : 16)
                .padding(.vertical, compact ? 6 : 10)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous).fill(.white)
                        .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(c).offset(y: 5))
                )
                .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Theme.ink, lineWidth: 2.5))
            ZStack(alignment: .topLeading) {
                ComicTail().fill(Theme.ink).frame(width: 18, height: 18)
                ComicTail().fill(.white).frame(width: 12, height: 12).offset(x: 3)
            }
            .frame(width: 18, height: 18)
        }
    }

    private var burst: some View {
        HStack(spacing: 7) {
            Text(bubble.emoji).font(.system(size: 19))
            if !compact {
                Text(status)
                    .font(Theme.wordmark(14))
                    .foregroundStyle(ct.opacity(statusOpacity))
                    .lineLimit(2)
                    .frame(maxWidth: 200)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.horizontal, compact ? 18 : 34)
        .padding(.vertical, compact ? 16 : 22)
        .background(StarBurst().fill(c))
        .shadow(color: .black.opacity(0.35), radius: 5, y: 5)
    }

    private var crush: some View {
        VStack(spacing: -8) {
            content(color: Theme.ink)
                .padding(.horizontal, compact ? 8 : 16)
                .padding(.vertical, compact ? 5 : 9)
                .background(Capsule().fill(.white))
                .overlay(Capsule().stroke(c, lineWidth: 2.5))
                .shadow(color: .black.opacity(0.25), radius: 8, y: 6)
            Text("♥")
                .font(.system(size: 24))
                .foregroundStyle(c)
                .shadow(color: .black.opacity(0.3), radius: 2, y: 2)
        }
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

/// Downward-pointing triangle, flat side on top.
struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.minX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
        p.closeSubpath()
        return p
    }
}

/// Comic-book tail: a right-angled wedge pointing down and left.
struct ComicTail: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.minX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        p.closeSubpath()
        return p
    }
}

/// A 32-point party starburst filling its frame.
struct StarBurst: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let n = 32
        for i in 0..<n {
            let a = Double(i) / Double(n) * 2 * .pi
            let r = i % 2 == 0 ? 0.5 : 0.44
            let pt = CGPoint(x: rect.minX + rect.width * (0.5 + r * cos(a)),
                             y: rect.minY + rect.height * (0.5 + r * sin(a)))
            if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
        }
        p.closeSubpath()
        return p
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
        BubbleView(bubble: Bubble(text: "2-for-1 cocktails", emoji: "🍹", color: .white, shape: .burst), isPromo: true)
    }
    .padding()
    .background(Theme.softGrey)
}
