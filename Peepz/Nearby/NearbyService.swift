import Foundation
import ARKit
import MultipeerConnectivity
import NearbyInteraction
import Observation

/// What Peepz phones say to each other over the local network.
enum PeerMessage: Codable {
    /// Sent on connect: my anonymous ID, so the other phone can apply friends/blocks.
    case hello(id: String)
    /// My bubble. Only sent to people allowed to see it.
    case profile(id: String, bubble: Bubble)
    /// Stop showing my bubble (I went hidden, or you're no longer allowed to see it).
    case gone(id: String)
    /// My Nearby Interaction discovery token, so we can measure distance and direction.
    /// `isReply` stops the two phones answering each other's tokens forever.
    case niToken(Data, isReply: Bool)
}

/// Finds other Peepz users close by and measures where they are.
///
/// How it works:
/// 1. MultipeerConnectivity (Bluetooth + Wi-Fi, no internet) finds nearby phones running Peepz.
///    You only advertise yourself when your visibility is Friends or Everyone.
/// 2. Phones swap a random anonymous ID, then a bubble if the audience setting allows it.
/// 3. Phones swap Nearby Interaction tokens. The UWB chip (iPhone 11 and newer) then reports the
///    distance and direction to each person. With camera assistance (newer iPhones) it also gives
///    a position in the AR world, which is what pins the bubble above their head.
@Observable
final class NearbyService: NSObject {
    /// Real people found nearby, keyed by their anonymous ID.
    private(set) var peeps: [String: NearbyPeep] = [:]
    private(set) var statusText: String = ""
    let supportsDistance: Bool
    let supportsDirection: Bool
    let supportsCameraAssist: Bool

    @ObservationIgnored private weak var app: AppState?
    @ObservationIgnored private let myPeerID: MCPeerID
    @ObservationIgnored private let mcSession: MCSession
    @ObservationIgnored private var advertiser: MCNearbyServiceAdvertiser?
    @ObservationIgnored private var browser: MCNearbyServiceBrowser?
    @ObservationIgnored private var running = false

    // Per-connected-phone bookkeeping.
    @ObservationIgnored private var peepIDForPeer: [MCPeerID: String] = [:]
    @ObservationIgnored private var sentProfileTo: Set<MCPeerID> = []
    @ObservationIgnored private var niSessions: [MCPeerID: NISession] = [:]
    @ObservationIgnored private var niConfigs: [MCPeerID: NINearbyPeerConfiguration] = [:]
    @ObservationIgnored private var sentTokenTo: Set<MCPeerID> = []
    @ObservationIgnored private var arAssisted: Set<MCPeerID> = []
    /// Phones where a camera-assisted session failed. They get plain distance sessions instead.
    @ObservationIgnored private var assistFailed: Set<MCPeerID> = []
    @ObservationIgnored private var restarts: [MCPeerID: Int] = [:]
    /// A throwaway session made at start, to check Nearby Interaction works and to trigger the permission prompt.
    @ObservationIgnored private var probe: NISession?

    /// The last few steps of the connection and distance handshake, newest last, for the debug panel.
    private(set) var events: [String] = []
    @ObservationIgnored private let clock: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "HH:mm:ss"; return f
    }()

    private func log(_ text: String) {
        let line = "\(clock.string(from: Date())) \(text)"
        RemoteLog.send(line)
        events.append(line)
        if events.count > 14 { events.removeFirst(events.count - 14) }
    }

    /// Diagnostics shown in the debug panel.
    var debugSummary: String {
        "UWB distance \(supportsDistance ? "yes" : "no") · direction \(supportsDirection ? "yes" : "no") · camera assist \(supportsCameraAssist ? "yes" : "no")\n" +
        "AR session given to NI: \(arSession == nil ? "no" : "yes") · connected phones: \(mcSession.connectedPeers.count) · NI sessions: \(niSessions.count) (assisted \(arAssisted.count))\n" +
        "Status: \(statusText)"
    }

    /// The camera's AR session, shared with Nearby Interaction for camera assistance.
    @ObservationIgnored private(set) var arSession: ARSession?

    /// Give Nearby Interaction the camera's AR session. Any distance sessions that started before the
    /// camera was ready are restarted, because camera assistance can only be switched on before a session runs.
    func attachARSession(_ session: ARSession) {
        guard arSession !== session else { return }
        arSession = session
        guard supportsCameraAssist else { return }
        for peer in Array(niSessions.keys) where !arAssisted.contains(peer) {
            niSessions[peer]?.invalidate()
            niSessions[peer] = nil
            niConfigs[peer] = nil
            sentTokenTo.remove(peer)
            if mcSession.connectedPeers.contains(peer) {
                startRanging(with: peer)
            }
        }
    }

    static let serviceType = "peepz-bbl"

    override init() {
        // A random, meaningless name. Never the user's device name.
        myPeerID = MCPeerID(displayName: String(UUID().uuidString.prefix(8)))
        mcSession = MCSession(peer: myPeerID, securityIdentity: nil, encryptionPreference: .required)

        let caps = NISession.deviceCapabilities
        supportsDistance = caps.supportsPreciseDistanceMeasurement
        supportsDirection = caps.supportsDirectionMeasurement
        supportsCameraAssist = caps.supportsCameraAssistance
        super.init()
        mcSession.delegate = self
    }

    func attach(_ app: AppState) {
        self.app = app
    }

    // MARK: - Start / stop

    func start() {
        guard !running else { return }
        running = true
        let browser = MCNearbyServiceBrowser(peer: myPeerID, serviceType: Self.serviceType)
        browser.delegate = self
        browser.startBrowsingForPeers()
        self.browser = browser
        updateAdvertising()
        RemoteLog.send(debugSummary.replacingOccurrences(of: "\n", with: " | "))
        log("started · advertising \(advertiser != nil ? "yes" : "no (Hidden)")")
        runProbe()
        statusText = supportsDistance ? "Looking for people nearby" : "Looking for people nearby (this iPhone can't measure distance)"
    }

    func stop() {
        guard running else { return }
        running = false
        browser?.stopBrowsingForPeers()
        browser = nil
        advertiser?.stopAdvertisingPeer()
        advertiser = nil
        mcSession.disconnect()
        niSessions.values.forEach { $0.invalidate() }
        niSessions.removeAll()
        niConfigs.removeAll()
        sentTokenTo.removeAll()
        arAssisted.removeAll()
        sentProfileTo.removeAll()
        peepIDForPeer.removeAll()
        peeps.removeAll()
    }

    /// Call when the user's bubble, visibility or friends change.
    func refresh() {
        guard running else { return }
        updateAdvertising()
        for peer in mcSession.connectedPeers {
            sendProfileIfAllowed(to: peer)
        }
        // Friend flags on people we can see.
        if let app {
            for (id, peep) in peeps {
                var updated = peep
                updated.isFriend = app.friends.contains(id)
                peeps[id] = updated
            }
        }
    }

    private func updateAdvertising() {
        let shouldAdvertise = running && (app?.visibility ?? .hidden) != .hidden
        if shouldAdvertise, advertiser == nil {
            let adv = MCNearbyServiceAdvertiser(peer: myPeerID, discoveryInfo: nil, serviceType: Self.serviceType)
            adv.delegate = self
            adv.startAdvertisingPeer()
            advertiser = adv
        } else if !shouldAdvertise, let adv = advertiser {
            adv.stopAdvertisingPeer()
            advertiser = nil
        }
    }

    // MARK: - Sending

    private func send(_ message: PeerMessage, to peer: MCPeerID) {
        guard let data = try? JSONEncoder().encode(message) else { return }
        try? mcSession.send(data, toPeers: [peer], with: .reliable)
    }

    private func isAllowedToSeeMe(_ peer: MCPeerID) -> Bool {
        guard let app else { return false }
        guard let theirID = peepIDForPeer[peer], !app.blocked.contains(theirID) else { return false }
        switch app.visibility {
        case .hidden: return false
        case .friends: return app.friends.contains(theirID)
        case .everyone: return true
        }
    }

    private func sendProfileIfAllowed(to peer: MCPeerID) {
        guard let app else { return }
        if isAllowedToSeeMe(peer), !app.bubble.isEmpty {
            if !sentProfileTo.contains(peer) { log("sent my bubble") }
            send(.profile(id: app.myID, bubble: app.bubble), to: peer)
            sentProfileTo.insert(peer)
            startRanging(with: peer)
        } else if sentProfileTo.contains(peer) {
            send(.gone(id: app.myID), to: peer)
            sentProfileTo.remove(peer)
        }
    }

    // MARK: - Receiving

    private func handle(_ message: PeerMessage, from peer: MCPeerID) {
        switch message {
        case .hello(let id):
            log("got hello")
            peepIDForPeer[peer] = id
            sendProfileIfAllowed(to: peer)
            // Measure distance to every connected phone, whoever is allowed to see whose bubble.
            startRanging(with: peer)

        case .profile(let id, let bubble):
            peepIDForPeer[peer] = id
            if peeps[id] == nil { log("got their bubble \(bubble.emoji)") }
            guard let app, !app.blocked.contains(id), TextFilter.isAllowed(bubble.text) else { return }
            var peep = peeps[id] ?? NearbyPeep(id: id, bubble: bubble)
            peep.bubble = bubble
            peep.isFriend = app.friends.contains(id)
            peeps[id] = peep
            startRanging(with: peer)

        case .gone(let id):
            peeps[id] = nil

        case .niToken(let data, let isReply):
            guard supportsDistance else { log("got distance token, but this iPhone has no UWB"); return }
            guard let token = try? NSKeyedUnarchiver.unarchivedObject(ofClass: NIDiscoveryToken.self, from: data) else {
                log("got distance token, couldn't read it"); return
            }
            let config = NINearbyPeerConfiguration(peerToken: token)
            let session = niSession(for: peer)
            let isFirstRun = niConfigs[peer] == nil
            if arAssisted.contains(peer), let arSession {
                // Apple: set the flag before setARSession, and link the AR session before the first run().
                config.isCameraAssistanceEnabled = true
                if isFirstRun {
                    session.setARSession(arSession)
                }
            }
            niConfigs[peer] = config
            session.run(config)
            log("got token\(isReply ? " (reply)" : "") · running distance\(config.isCameraAssistanceEnabled ? " + camera" : "")")
            // They may have a fresh session, so always answer with our token (but never answer an answer).
            if !isReply {
                sendToken(to: peer, session: session, isReply: true)
            }
        }
    }

    private func peerDisconnected(_ peer: MCPeerID) {
        if let id = peepIDForPeer[peer] { peeps[id] = nil }
        peepIDForPeer[peer] = nil
        log("phone disconnected")
        sentProfileTo.remove(peer)
        sentTokenTo.remove(peer)
        arAssisted.remove(peer)
        assistFailed.remove(peer)
        restarts[peer] = nil
        niConfigs[peer] = nil
        niSessions[peer]?.invalidate()
        niSessions[peer] = nil
    }

    // MARK: - Nearby Interaction

    /// Make a plain session and point it at itself. Nearby Interaction asks the user for permission the
    /// first time any session runs, so this gets the prompt out of the way before a real person is found.
    private func runProbe() {
        guard supportsDistance, probe == nil else { return }
        let session = NISession()
        session.delegateQueue = .main
        session.delegate = self
        probe = session
        guard let token = session.discoveryToken else {
            log("test session: no token")
            return
        }
        log("test session: token ok, asking permission")
        session.run(NINearbyPeerConfiguration(peerToken: token))
        DispatchQueue.main.asyncAfter(deadline: .now() + 4) { [weak self] in
            self?.probe?.invalidate()
            self?.probe = nil
        }
    }

    private func niSession(for peer: MCPeerID) -> NISession {
        if let existing = niSessions[peer] { return existing }
        let session = NISession()
        session.delegateQueue = .main
        session.delegate = self
        // On iOS 26 a session given the AR session straight away has no discovery token, so the camera is
        // linked later, after the token is read and just before the first run (see linkCamera).
        if supportsCameraAssist, !assistFailed.contains(peer), arSession != nil {
            arAssisted.insert(peer)
        }
        niSessions[peer] = session
        log("new \(arAssisted.contains(peer) ? "camera" : "plain") session · token \(session.discoveryToken == nil ? "missing" : "ok")")
        return session
    }

    /// Begin measuring distance to a phone that is showing us its bubble, or that we show ours to.
    private func startRanging(with peer: MCPeerID) {
        guard supportsDistance else {
            if !sentTokenTo.contains(peer) { log("this iPhone has no UWB, can't measure distance") }
            sentTokenTo.insert(peer)
            return
        }
        guard !sentTokenTo.contains(peer) else { return }
        sendToken(to: peer, session: niSession(for: peer), isReply: false)
    }

    private func sendToken(to peer: MCPeerID, session: NISession, isReply: Bool) {
        guard let token = session.discoveryToken,
              let data = try? NSKeyedArchiver.archivedData(withRootObject: token, requiringSecureCoding: true)
        else {
            log("no distance token available yet")
            // Camera assistance may be what's stopping it. Swap to a plain distance session and try once more.
            if arAssisted.contains(peer), !assistFailed.contains(peer) {
                assistFailed.insert(peer)
                arAssisted.remove(peer)
                session.invalidate()
                niSessions[peer] = nil
                niConfigs[peer] = nil
                let plain = niSession(for: peer)
                sendToken(to: peer, session: plain, isReply: isReply)
            }
            return
        }
        send(.niToken(data, isReply: isReply), to: peer)
        log("sent token\(isReply ? " (reply)" : "")")
        sentTokenTo.insert(peer)
    }

    private func mcPeer(for session: NISession) -> MCPeerID? {
        niSessions.first { $0.value === session }?.key
    }
}

// MARK: - MCSessionDelegate

extension NearbyService: MCSessionDelegate {
    func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            switch state {
            case .connected:
                self.log("phone connected")
                if let app = self.app { self.send(.hello(id: app.myID), to: peerID) }
            case .notConnected:
                self.peerDisconnected(peerID)
            case .connecting:
                break
            @unknown default:
                break
            }
        }
    }

    func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
        guard let message = try? JSONDecoder().decode(PeerMessage.self, from: data) else { return }
        DispatchQueue.main.async { [weak self] in
            self?.handle(message, from: peerID)
        }
    }

    func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}
    func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}
    func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}

// MARK: - Finding and accepting phones

extension NearbyService: MCNearbyServiceBrowserDelegate, MCNearbyServiceAdvertiserDelegate {
    func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String: String]?) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard !self.mcSession.connectedPeers.contains(peerID) else { return }
            // If both phones advertise, only one of them sends the invite.
            let iAmAdvertising = self.advertiser != nil
            if !iAmAdvertising || self.myPeerID.displayName < peerID.displayName {
                browser.invitePeer(peerID, to: self.mcSession, withContext: nil, timeout: 15)
            }
        }
    }

    func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {}

    func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer peerID: MCPeerID,
                    withContext context: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
        invitationHandler(true, mcSession)
    }
}

// MARK: - NISessionDelegate

extension NearbyService: NISessionDelegate {
    func session(_ session: NISession, didUpdate nearbyObjects: [NINearbyObject]) {
        guard let peer = mcPeer(for: session), let id = peepIDForPeer[peer], var peep = peeps[id],
              let object = nearbyObjects.first else { return }
        peep.distance = object.distance
        peep.direction = object.direction
        peep.cameraAssisted = arAssisted.contains(peer)
        if peep.updates == 0 { log("first distance reading \(object.distance.map { String(format: "%.1f m", $0) } ?? "(none)")") }
        peep.updates += 1
        if let transform = session.worldTransform(for: object) {
            peep.worldPosition = SIMD3(transform.columns.3.x, transform.columns.3.y, transform.columns.3.z)
            peep.worldFixAt = Date()
            peep.coaching = nil
        }
        peeps[id] = peep
    }

    func session(_ session: NISession, didRemove nearbyObjects: [NINearbyObject], reason: NINearbyObject.RemovalReason) {
        guard let peer = mcPeer(for: session) else { return }
        log("lost their phone (\(reason == .timeout ? "timeout" : "they stopped"))")
        switch reason {
        case .timeout:
            // They wandered off or the signal dropped. Try again while still connected.
            if let config = niConfigs[peer], mcSession.connectedPeers.contains(peer) {
                session.run(config)
            }
        case .peerEnded:
            niSessions[peer]?.invalidate()
            niSessions[peer] = nil
            niConfigs[peer] = nil
            sentTokenTo.remove(peer)
            arAssisted.remove(peer)
        @unknown default:
            break
        }
    }

    /// Camera assistance needs the phone to move a little before it can place someone in 3D.
    /// Turn Apple's reasons into a short tip for the user.
    func session(_ session: NISession, didUpdateAlgorithmConvergence convergence: NIAlgorithmConvergence, for object: NINearbyObject?) {
        guard let peer = mcPeer(for: session), let id = peepIDForPeer[peer], var peep = peeps[id] else { return }
        peep.convergence = String(describing: convergence.status)
        switch convergence.status {
        case .converged:
            peep.coaching = nil
        case .notConverged(let reasons):
            if reasons.contains(.insufficientLighting) {
                peep.coaching = "Needs more light to place them"
            } else if reasons.contains(.insufficientHorizontalSweep) {
                peep.coaching = "Move your phone slowly side to side"
            } else if reasons.contains(.insufficientVerticalSweep) {
                peep.coaching = "Move your phone slowly up and down"
            } else {
                peep.coaching = "Move around a little to place them"
            }
        default:
            peep.coaching = "Finding where they are…"
        }
        peeps[id] = peep
    }

    func sessionSuspensionEnded(_ session: NISession) {
        if let peer = mcPeer(for: session), let config = niConfigs[peer] {
            session.run(config)
        }
    }

    func session(_ session: NISession, didInvalidateWith error: Error) {
        let niError = error as? NIError
        if session === probe {
            log("test session stopped: \(niError.map { "NIError \($0.code.rawValue)" } ?? "") \(error.localizedDescription)")
            probe = nil
            return
        }
        guard let peer = mcPeer(for: session) else {
            log("old session stopped: \(error.localizedDescription)")
            return
        }
        log("distance stopped: \(niError.map { "NIError \($0.code.rawValue)" } ?? "") \(error.localizedDescription)")
        let wasAssisted = arAssisted.contains(peer)
        niSessions[peer] = nil
        niConfigs[peer] = nil
        sentTokenTo.remove(peer)
        arAssisted.remove(peer)
        if niError?.code == .userDidNotAllow {
            statusText = "Distance is off. Allow Nearby Interactions for Peepz in Settings."
            return
        }
        // If camera assistance is what broke it, fall back to plain distance and direction.
        if wasAssisted { assistFailed.insert(peer) }
        let tries = (restarts[peer] ?? 0) + 1
        restarts[peer] = tries
        if tries <= 3, mcSession.connectedPeers.contains(peer) {
            // Start a fresh session and swap tokens again.
            startRanging(with: peer)
        }
    }
}
