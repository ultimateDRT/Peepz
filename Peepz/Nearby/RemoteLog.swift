import Foundation
import UIKit

/// TESTING ONLY. Sends diagnostic lines to a private-ish ntfy.sh topic so problems on testers' phones
/// can be read without screenshots. Lines are anonymous step names, never status text.
/// Remove before a public release.
enum RemoteLog {
    private static let url = URL(string: "https://ntfy.sh/peepz-dbg-2327069ffa81a549")!
    private static let queue = DispatchQueue(label: "peepz.remotelog")
    private static var buffer: [String] = []
    private static var scheduled = false

    /// A short random label for this install, plus the phone model, so two testers' logs can be told apart.
    static let device: String = {
        let key = "peepz.logID"
        let id = UserDefaults.standard.string(forKey: key) ?? String(UUID().uuidString.prefix(4))
        UserDefaults.standard.set(id, forKey: key)
        var info = utsname()
        uname(&info)
        let model = withUnsafeBytes(of: &info.machine) { raw in
            String(decoding: raw.prefix { $0 != 0 }, as: UTF8.self)
        }
        return "\(id) \(model) iOS \(UIDevice.current.systemVersion)"
    }()

    static func send(_ line: String) {
        queue.async {
            buffer.append(line)
            guard !scheduled else { return }
            scheduled = true
            // Batch lines: ntfy limits how often one network can post.
            queue.asyncAfter(deadline: .now() + 6) { flush() }
        }
    }

    private static func flush() {
        scheduled = false
        guard !buffer.isEmpty else { return }
        var text = "[\(device)]\n" + buffer.joined(separator: "\n")
        buffer.removeAll()
        if text.utf8.count > 3800 { text = String(text.prefix(3800)) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = Data(text.utf8)
        URLSession.shared.dataTask(with: request).resume()
    }
}
