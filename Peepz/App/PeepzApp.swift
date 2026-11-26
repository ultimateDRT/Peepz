import SwiftUI

@main
struct PeepzApp: App {
    @State private var app: AppState = {
        let state = AppState()
        ScreenshotMode.prepare(state)
        return state
    }()
    @State private var nearby = NearbyService()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(app)
                .environment(nearby)
                .tint(Theme.pink)
        }
    }
}

struct RootView: View {
    @Environment(AppState.self) private var app
    @Environment(NearbyService.self) private var nearby
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        Group {
            if app.hasOnboarded {
                CameraHomeView()
                    .transition(.opacity)
            } else {
                OnboardingFlow()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: app.hasOnboarded)
        .onAppear { nearby.attach(app) }
        .onChange(of: scenePhase) { _, phase in
            // Stop broadcasting as soon as the app leaves the screen. No background tracking.
            if phase == .background { nearby.stop() }
            if phase == .active, app.hasOnboarded { nearby.start() }
        }
    }
}
