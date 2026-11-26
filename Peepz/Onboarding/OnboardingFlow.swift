import SwiftUI

/// First run: welcome, set your bubble, set your visibility, done.
struct OnboardingFlow: View {
    @Environment(AppState.self) private var app
    @State private var step = 0
    @State private var draftBubble = Bubble.empty
    @State private var draftVisibility = PeepVisibility.hidden

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            switch step {
            case 0: welcome.transition(.opacity)
            case 1: setBubble.transition(.move(edge: .trailing).combined(with: .opacity))
            default: setVisibility.transition(.move(edge: .trailing).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.85), value: step)
        .onAppear {
            draftBubble = app.bubble
            draftVisibility = app.visibility
        }
    }

    // MARK: Welcome

    private var welcome: some View {
        VStack(spacing: 18) {
            Spacer()
            FullLogo(width: 230)
            Text("See what people around you are up to.\nPoint your camera. Say hi.")
                .font(Theme.font(18, .medium))
                .foregroundStyle(Theme.ink.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.top, 4)
            Spacer()
            Button("Get started") { step = 1 }
                .buttonStyle(PrimaryButtonStyle())
            Text("You start hidden. Nobody sees you until you choose.")
                .font(Theme.font(13))
                .foregroundStyle(Theme.midGrey)
        }
        .padding(24)
    }

    // MARK: Set your bubble

    private var setBubble: some View {
        let canContinue = !draftBubble.isEmpty && TextFilter.isAllowed(draftBubble.text)
        return VStack(alignment: .leading, spacing: 0) {
            header(step: 1, title: "Set your bubble", subtitle: "This floats above your head for people nearby.")
            ScrollView {
                BubbleEditor(bubble: $draftBubble)
                    .padding(.vertical, 12)
            }
            .scrollDismissesKeyboard(.interactively)
            Button("Next") {
                app.bubble = draftBubble
                step = 2
            }
            .buttonStyle(PrimaryButtonStyle(enabled: canContinue))
            .disabled(!canContinue)
        }
        .padding(24)
    }

    // MARK: Set visibility

    private var setVisibility: some View {
        VStack(alignment: .leading, spacing: 0) {
            header(step: 2, title: "Who can see you?", subtitle: "Change this any time from the dot on the camera screen.")
            VisibilityPicker(visibility: $draftVisibility)
                .padding(.top, 20)
            Spacer()
            Button("Done") {
                app.visibility = draftVisibility
                app.hasOnboarded = true
            }
            .buttonStyle(PrimaryButtonStyle())
        }
        .padding(24)
    }

    private func header(step: Int, title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Button {
                    self.step -= 1
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(Theme.ink)
                        .frame(width: 40, height: 40)
                        .background(Circle().fill(Theme.softGrey))
                }
                Spacer()
                HStack(spacing: 6) {
                    ForEach(1...2, id: \.self) { i in
                        Capsule()
                            .fill(i <= step ? Theme.pink : Theme.softGrey)
                            .frame(width: i == step ? 24 : 8, height: 8)
                    }
                }
            }
            .padding(.bottom, 12)
            Text(title)
                .font(Theme.display(34))
                .foregroundStyle(Theme.ink)
            Text(subtitle)
                .font(Theme.font(16))
                .foregroundStyle(Theme.midGrey)
        }
    }
}

#Preview {
    OnboardingFlow().environment(AppState())
}
