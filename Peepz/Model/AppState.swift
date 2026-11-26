import Foundation
import Observation

/// Everything about *you* that the app remembers between launches.
@Observable
final class AppState {
    var bubble: Bubble { didSet { save() } }
    var visibility: PeepVisibility { didSet { save() } }
    var hasOnboarded: Bool { didSet { save() } }
    var friends: Set<String> { didSet { save() } }
    var blocked: Set<String> { didSet { save() } }
    /// Shows simulated people so the app can be tried with one phone.
    var demoMode: Bool { didSet { save() } }

    /// Random anonymous ID for this install. Only ever shared with nearby Peepz phones.
    /// TODO: rotate this regularly (see README, privacy).
    let myID: String

    private struct Stored: Codable {
        var bubble: Bubble
        var visibility: PeepVisibility
        var hasOnboarded: Bool
        var friends: Set<String>
        var blocked: Set<String>
        var demoMode: Bool
        var myID: String
    }

    private static let key = "peepz.state.v1"

    init() {
        if let data = UserDefaults.standard.data(forKey: Self.key),
           let stored = try? JSONDecoder().decode(Stored.self, from: data) {
            bubble = stored.bubble
            visibility = stored.visibility
            hasOnboarded = stored.hasOnboarded
            friends = stored.friends
            blocked = stored.blocked
            demoMode = stored.demoMode
            myID = stored.myID
        } else {
            bubble = .empty
            visibility = .hidden
            hasOnboarded = false
            friends = []
            blocked = []
            demoMode = true
            myID = String(UUID().uuidString.prefix(12))
        }
    }

    func toggleFriend(_ id: String) {
        if friends.contains(id) { friends.remove(id) } else { friends.insert(id) }
    }

    func block(_ id: String) {
        blocked.insert(id)
        friends.remove(id)
    }

    func resetAll() {
        UserDefaults.standard.removeObject(forKey: Self.key)
        bubble = .empty
        visibility = .hidden
        friends = []
        blocked = []
        demoMode = true
        hasOnboarded = false
    }

    private func save() {
        let stored = Stored(bubble: bubble, visibility: visibility, hasOnboarded: hasOnboarded,
                            friends: friends, blocked: blocked, demoMode: demoMode, myID: myID)
        if let data = try? JSONEncoder().encode(stored) {
            UserDefaults.standard.set(data, forKey: Self.key)
        }
    }
}
