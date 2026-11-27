import SwiftUI

/// Edit your own bubble from the camera screen.
struct BubbleEditSheet: View {
    @Environment(AppState.self) private var app
    @Environment(\.dismiss) private var dismiss
    @State private var draft = Bubble.empty

    var body: some View {
        let canSave = !draft.isEmpty && TextFilter.isAllowed(draft.text)
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    BubbleEditor(bubble: $draft)
                    BubbleTimingPicker()
                }
                .padding(24)
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle("Your bubble")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }.foregroundStyle(Theme.ink)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        app.bubble = draft
                        dismiss()
                    }
                    .font(Theme.font(17, .bold))
                    .foregroundStyle(canSave ? Theme.pink : Theme.midGrey)
                    .disabled(!canSave)
                }
            }
        }
        .onAppear { draft = app.bubble }
    }
}

/// Change who can see you.
struct VisibilitySheet: View {
    @Environment(AppState.self) private var app
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        @Bindable var app = app
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Who can see you?")
                    .font(Theme.display(26))
                    .foregroundStyle(Theme.ink)
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.ink)
                        .frame(width: 34, height: 34)
                        .background(Circle().fill(Theme.softGrey))
                }
            }
            VisibilityPicker(visibility: $app.visibility)
            Spacer(minLength: 0)
        }
        .padding(24)
    }
}

/// Tap someone's bubble: add them as a friend, block or report.
struct PeepSheet: View {
    @Environment(AppState.self) private var app
    @Environment(\.dismiss) private var dismiss
    let peep: NearbyPeep
    @State private var reported = false

    var body: some View {
        let isFriend = app.friends.contains(peep.id)
        VStack(spacing: 18) {
            BubbleView(bubble: peep.bubble, isPromo: peep.isPromo, isFriend: isFriend, distance: peep.distance)
                .padding(.top, 28)

            if peep.isSimulated {
                Text("Demo person")
                    .font(Theme.font(13, .medium))
                    .foregroundStyle(Theme.midGrey)
            }

            if !peep.isPromo {
                Button(isFriend ? "Remove friend" : "Add friend") {
                    app.toggleFriend(peep.id)
                }
                .buttonStyle(PrimaryButtonStyle())
            }

            HStack(spacing: 12) {
                Button {
                    app.block(peep.id)
                    dismiss()
                } label: {
                    Label("Block", systemImage: "hand.raised.fill")
                        .frame(maxWidth: .infinity)
                }
                Button {
                    // TODO: send reports to a moderation backend. For now this only hides them.
                    reported = true
                    app.block(peep.id)
                } label: {
                    Label(reported ? "Reported" : "Report", systemImage: "flag.fill")
                        .frame(maxWidth: .infinity)
                }
            }
            .font(Theme.font(15, .bold))
            .foregroundStyle(Theme.ink)
            .padding(.vertical, 14)
            .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Theme.softGrey))

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 24)
    }
}

/// When other people can see your bubble: only while Peepz is open, or also over Bluetooth when it's closed.
struct BubbleTimingPicker: View {
    @Environment(AppState.self) private var app

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("When can people see it?")
                .font(Theme.font(15, .bold))
                .foregroundStyle(Theme.ink)
            row(title: "While PeepZ is open",
                detail: "Your bubble floats above you while the app is on screen.",
                selected: !app.visibleWhenClosed) { app.visibleWhenClosed = false }
            row(title: "All the time",
                detail: app.visibility == .everyone
                    ? "When PeepZ is closed, people nearby can still see your bubble in their Nearby list and nudge you. It floats above you once you open the app."
                    : "Works when you're visible to Everyone. iPhone can't check who's a friend while PeepZ is closed.",
                selected: app.visibleWhenClosed) { app.visibleWhenClosed = true }
        }
    }

    private func row(title: String, detail: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                    .font(.system(size: 20))
                    .foregroundStyle(selected ? Theme.pink : Theme.midGrey)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(Theme.font(15, .bold))
                    Text(detail).font(Theme.font(13, .regular)).foregroundStyle(Theme.ink.opacity(0.6))
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .foregroundStyle(Theme.ink)
                Spacer(minLength: 0)
            }
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Theme.softGrey))
            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(selected ? Theme.pink : .clear, lineWidth: 1.5))
        }
        .buttonStyle(.plain)
    }
}
