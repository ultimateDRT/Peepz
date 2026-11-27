import SwiftUI

/// Edit a bubble: text (max 40 characters), emoji, colour, or a quick preset.
struct BubbleEditor: View {
    @Binding var bubble: Bubble
    @FocusState private var textFocused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            HStack {
                Spacer()
                BubbleView(bubble: bubble)
                    .animation(.spring(response: 0.3, dampingFraction: 0.75), value: bubble)
                Spacer()
            }
            .padding(.vertical, 8)

            VStack(alignment: .leading, spacing: 8) {
                label("Status")
                HStack {
                    TextField("What's your vibe?", text: Binding(
                        get: { bubble.text },
                        set: { bubble.text = String($0.prefix(Bubble.maxLength)) }
                    ))
                    .font(Theme.font(18, .medium))
                    .foregroundStyle(Theme.ink)
                    .tint(Theme.pink)
                    .focused($textFocused)
                    .submitLabel(.done)
                    Text("\(bubble.text.count)/\(Bubble.maxLength)")
                        .font(Theme.font(13, .medium))
                        .foregroundStyle(bubble.text.count >= Bubble.maxLength ? Theme.pink : Theme.midGrey)
                }
                .padding(16)
                .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Theme.softGrey))
                if !TextFilter.isAllowed(bubble.text) {
                    Text("Let's keep it friendly. Try different words.")
                        .font(Theme.font(13, .medium))
                        .foregroundStyle(Theme.pink)
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                label("Quick picks")
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Bubble.presets, id: \.text) { preset in
                            Button {
                                let shape = bubble.shape
                                bubble = preset
                                bubble.shape = shape
                                textFocused = false
                            } label: {
                                Text("\(preset.emoji) \(preset.text)")
                                    .font(Theme.font(14, .medium))
                                    .foregroundStyle(Theme.ink)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 10)
                                    .background(Capsule().fill(preset.color.fill.opacity(preset.color == .white ? 1 : 0.35)))
                                    .overlay(Capsule().stroke(Theme.ink.opacity(0.08)))
                            }
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                label("Shape")
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(BubbleShape.allCases) { shape in
                            let on = bubble.shape == shape
                            Button {
                                bubble.shape = shape
                            } label: {
                                Text(shape.title)
                                    .font(Theme.font(14, .bold))
                                    .foregroundStyle(on ? .white : Theme.ink)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 10)
                                    .background(RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .fill(on ? Theme.ink : .white))
                                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(on ? Theme.ink : Theme.ink.opacity(0.12), lineWidth: 1.5))
                            }
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                label("Emoji")
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Bubble.emojiChoices, id: \.self) { emoji in
                            Button {
                                bubble.emoji = emoji
                            } label: {
                                Text(emoji)
                                    .font(.system(size: 26))
                                    .frame(width: 48, height: 48)
                                    .background(
                                        Circle().fill(bubble.emoji == emoji ? Theme.pink.opacity(0.18) : Theme.softGrey)
                                    )
                                    .overlay(Circle().stroke(bubble.emoji == emoji ? Theme.pink : .clear, lineWidth: 2))
                            }
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                label("Colour")
                HStack(spacing: 12) {
                    ForEach(BubbleColor.allCases) { colour in
                        Button {
                            bubble.color = colour
                        } label: {
                            Circle()
                                .fill(colour.fill)
                                .frame(width: 40, height: 40)
                                .overlay(Circle().stroke(Theme.ink.opacity(colour == .white ? 0.15 : 0), lineWidth: 1))
                                .overlay(
                                    Circle().stroke(Theme.ink, lineWidth: 3)
                                        .padding(-5)
                                        .opacity(bubble.color == colour ? 1 : 0)
                                )
                        }
                    }
                }
                .padding(.leading, 5)
            }
        }
    }

    private func label(_ text: String) -> some View {
        Text(text.uppercased())
            .font(Theme.font(12, .bold))
            .tracking(1)
            .foregroundStyle(Theme.midGrey)
    }
}

/// Pick one of Hidden / Friends / Everyone.
struct VisibilityPicker: View {
    @Binding var visibility: PeepVisibility

    var body: some View {
        VStack(spacing: 12) {
            ForEach(PeepVisibility.allCases) { option in
                Button {
                    withAnimation(.spring(response: 0.3)) { visibility = option }
                } label: {
                    HStack(spacing: 14) {
                        Image(systemName: option.symbol)
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                            .frame(width: 48, height: 48)
                            .background(Circle().fill(option.dotColor.opacity(option == .hidden ? 0.25 : 0.6)))
                        VStack(alignment: .leading, spacing: 3) {
                            Text(option.title)
                                .font(Theme.font(18, .bold))
                                .foregroundStyle(Theme.ink)
                            Text(option.subtitle)
                                .font(Theme.font(14))
                                .foregroundStyle(Theme.midGrey)
                                .multilineTextAlignment(.leading)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: visibility == option ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 24))
                            .foregroundStyle(visibility == option ? Theme.pink : Theme.midGrey.opacity(0.4))
                    }
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .fill(visibility == option ? Theme.pink.opacity(0.08) : Theme.softGrey)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(visibility == option ? Theme.pink : .clear, lineWidth: 2)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}
