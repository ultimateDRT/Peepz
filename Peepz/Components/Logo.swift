import SwiftUI

/// The full logo (icon + "PeepZ" wordmark), from David's preferred design (Peepz.pdf).
struct FullLogo: View {
    var width: CGFloat = 220

    var body: some View {
        Image("PeepzLogo")
            .resizable()
            .interpolation(.high)
            .scaledToFit()
            .frame(width: width)
            .accessibilityLabel("PeepZ")
    }
}

/// "PeepZ" wordmark: white Titan One letters with a dark outline, and a pink Z.
struct Wordmark: View {
    var size: CGFloat = 44

    var body: some View {
        HStack(spacing: 0) {
            OutlinedText(text: "Peep", fill: .white, size: size)
            OutlinedText(text: "Z", fill: Theme.pink, size: size)
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
                    .font(Theme.wordmark(size))
                    .foregroundStyle(Theme.ink)
                    .offset(x: CGFloat(cos(angle)) * w, y: CGFloat(sin(angle)) * w)
            }
            Text(text)
                .font(Theme.wordmark(size))
                .foregroundStyle(fill)
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        FullLogo()
        Wordmark(size: 48)
    }
}
