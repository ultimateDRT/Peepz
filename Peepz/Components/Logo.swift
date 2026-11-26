import SwiftUI

/// Logo direction D: a smiling speech bubble on a pink rounded square.
struct LogoIcon: View {
    var size: CGFloat = 96

    var body: some View {
        RoundedRectangle(cornerRadius: size * 0.26, style: .continuous)
            .fill(Theme.pink)
            .frame(width: size, height: size)
            .overlay(
                ZStack {
                    VStack(spacing: 0) {
                        RoundedRectangle(cornerRadius: size * 0.2, style: .continuous)
                            .fill(.white)
                            .frame(width: size * 0.64, height: size * 0.46)
                        BubbleTail()
                            .fill(.white)
                            .frame(width: size * 0.16, height: size * 0.1)
                            .offset(x: -size * 0.1)
                    }
                    Face(size: size)
                        .offset(y: -size * 0.05)
                }
                .offset(y: size * 0.03)
            )
    }

    private struct Face: View {
        let size: CGFloat
        var body: some View {
            VStack(spacing: size * 0.05) {
                HStack(spacing: size * 0.16) {
                    Circle().fill(Theme.ink).frame(width: size * 0.07)
                    Circle().fill(Theme.ink).frame(width: size * 0.07)
                }
                Smile()
                    .stroke(Theme.ink, style: StrokeStyle(lineWidth: size * 0.04, lineCap: .round))
                    .frame(width: size * 0.2, height: size * 0.07)
            }
        }
    }

    private struct Smile: Shape {
        func path(in rect: CGRect) -> Path {
            var p = Path()
            p.move(to: CGPoint(x: rect.minX, y: rect.minY))
            p.addQuadCurve(to: CGPoint(x: rect.maxX, y: rect.minY), control: CGPoint(x: rect.midX, y: rect.maxY * 1.6))
            return p
        }
    }
}

/// "peepz" wordmark: white bubble letters with a dark outline, and a pink z.
struct Wordmark: View {
    var size: CGFloat = 44

    var body: some View {
        HStack(spacing: 0) {
            OutlinedText(text: "peep", fill: .white, size: size)
            OutlinedText(text: "z", fill: Theme.pink, size: size)
        }
    }
}

private struct OutlinedText: View {
    let text: String
    let fill: Color
    let size: CGFloat

    var body: some View {
        let w = max(1.5, size * 0.06)
        ZStack {
            ForEach(0..<8, id: \.self) { i in
                let angle = Double(i) * .pi / 4
                Text(text)
                    .font(Theme.display(size))
                    .foregroundStyle(Theme.ink)
                    .offset(x: CGFloat(cos(angle)) * w, y: CGFloat(sin(angle)) * w)
            }
            Text(text)
                .font(Theme.display(size))
                .foregroundStyle(fill)
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        LogoIcon(size: 120)
        Wordmark(size: 48)
    }
}
