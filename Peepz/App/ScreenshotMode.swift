import Foundation

/// Lets the cloud Mac open the app straight onto one screen to take screenshots.
/// Launch with `-uiScreen <name>`. Does nothing in normal use.
enum ScreenshotMode {
    static let screen: String? = {
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "-uiScreen"), i + 1 < args.count else { return nil }
        return args[i + 1]
    }()

    static var isActive: Bool { screen != nil }

    /// Onboarding step to start on: welcome = 0, bubble = 1, visibility = 2.
    static var onboardingStep: Int? {
        switch screen {
        case "welcome": return 0
        case "bubble": return 1
        case "visibility": return 2
        default: return nil
        }
    }

    static var isCameraScreen: Bool {
        guard let screen else { return false }
        return screen.hasPrefix("camera")
    }

    /// Puts the app in a tidy state for the requested screen.
    static func prepare(_ app: AppState) {
        guard isActive else { return }
        app.friends = ["sim-2"]
        app.blocked = []
        app.demoMode = true
        if isCameraScreen {
            app.bubble = Bubble(text: "Ask me about my band", emoji: "🎸", color: .lime)
            app.visibility = .everyone
            app.hasOnboarded = true
        } else {
            app.bubble = screen == "bubble" ? Bubble(text: "Ask me about my band", emoji: "🎸", color: .lime) : .empty
            app.visibility = screen == "visibility" ? .everyone : .hidden
            app.hasOnboarded = false
        }
    }
}
