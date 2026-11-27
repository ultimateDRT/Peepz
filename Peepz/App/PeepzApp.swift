import SwiftUI

@main
struct PeepzApp: App {
    @State private var app = AppState()
    @State private var nearby = NearbyService()
    @State private var presence = PresenceService()

    var body: some Scene {
        WindowGroup {
            RootView(presence: presence)
                .environment(app)
                .environment(nearby)
                .environment(presence)
                .tint(Theme.pink)
                .preferredColorScheme(.light)
        }
    }
}

struct RootView: View {
    let presence: PresenceService
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
        .onAppear {
            nearby.attach(app)
            presence.attach(app)
            updatePresence()
        }
        .onChange(of: scenePhase) { _, phase in
            // Stop broadcasting as soon as the app leaves the screen. No background tracking.
            if phase == .background { nearby.stop() }
            if phase == .active, app.hasOnboarded { nearby.start() }
            updatePresence(phase)
        }
        .onChange(of: app.visibility) { updatePresence() }
        .onChange(of: app.bubble) { updatePresence() }
        .onChange(of: app.visibleWhenClosed) { updatePresence() }
        .onChange(of: app.hasOnboarded) {
            if app.hasOnboarded { PresenceService.requestNotificationPermission() }
            updatePresence()
        }
        .task { if app.hasOnboarded { PresenceService.requestNotificationPermission() } }
    }

    /// "Peepz is open here" signal only while on screen and not Hidden; listening for others always.
    private func updatePresence(_ phase: ScenePhase? = nil) {
        guard app.hasOnboarded else { return }
        presence.update(appActive: (phase ?? scenePhase) == .active)
    }
}
