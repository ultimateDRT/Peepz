import Foundation
import CoreBluetooth
import UserNotifications
import Observation

/// Bluetooth presence: finds Peepz users near you even when their app, or yours, is closed.
///
/// - **"Peepz is open here":** while Peepz is on screen and you're not Hidden, the phone advertises the
///   Peepz Bluetooth service with a short "open" marker. Closed phones nearby that hear it show a
///   notification (at most one every 15 minutes).
/// - **Bubbles while closed:** if you chose "All the time" and you're visible to Everyone, the phone keeps
///   advertising in the background. Phones with Peepz open read your bubble over Bluetooth and show it in
///   their "Nearby" tray. Bluetooth can't say where you're standing, so it isn't pinned above you.
/// - **Nudge:** someone can tap your bubble in their tray to send you a "someone wants to see your PeepZ"
///   notification. When you open Peepz, the exact UWB placement takes over.
///
/// iOS limits: a closed phone can't measure distance or direction, Friends-only can't be checked over
/// Bluetooth (so only Everyone is shared), and a force-quit app goes silent until opened again.
@Observable
final class PresenceService: NSObject {
    static let serviceUUID = CBUUID(string: "D86C534A-977B-442C-ABC9-A1B71C07E83E")
    static let bubbleUUID = CBUUID(string: "E1DF2E18-A916-4B25-B547-23BCCDB776CC")
    static let nudgeUUID = CBUUID(string: "9A13401E-697B-4119-B230-66BCF4D2728B")
    /// Sent as the Bluetooth local name while Peepz is on screen. iOS strips names from background adverts,
    /// so its presence means "this person has Peepz open right now".
    static let openMarker = "PZ1"
    static let quietPeriod: TimeInterval = 15 * 60

    /// A phone heard over Bluetooth.
    struct Heard {
        var peripheral: CBPeripheral
        var rssi: Int
        var seen: Date
        var isOpen: Bool
        var peepID: String?
        var bubble: Bubble?
        var lastRead: Date?
        var reading = false
    }

    private struct Card: Codable { let id: String; let bubble: Bubble }

    @ObservationIgnored private var central: CBCentralManager!
    @ObservationIgnored private var peripheral: CBPeripheralManager!
    @ObservationIgnored private weak var app: AppState?
    @ObservationIgnored private var appIsActive = true
    @ObservationIgnored private var serviceAdded = false
    @ObservationIgnored private var advertisingMode: String?
    @ObservationIgnored private(set) var heard: [UUID: Heard] = [:]
    @ObservationIgnored private var nudgeQueue: Set<UUID> = []
    @ObservationIgnored private var cardCache = Data()

    private let lastAlertKey = "peepz.lastNearbyAlert"
    private let lastNudgeAlertKey = "peepz.lastNudgeAlert"

    override init() {
        super.init()
        central = CBCentralManager(delegate: self, queue: nil,
                                   options: [CBCentralManagerOptionRestoreIdentifierKey: "peepz.presence.central"])
        peripheral = CBPeripheralManager(delegate: self, queue: nil,
                                         options: [CBPeripheralManagerOptionRestoreIdentifierKey: "peepz.presence.peripheral"])
    }

    func attach(_ app: AppState) { self.app = app }

    static func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    /// Call when the app comes on screen or goes away, or settings change.
    func update(appActive: Bool) {
        appIsActive = appActive
        refreshCard()
        refreshAdvertising()
        refreshScanning()
    }

    /// People heard over Bluetooth with a readable bubble, strongest signal first.
    var nearbyPeeps: [NearbyPeep] {
        let cutoff = Date().addingTimeInterval(-15)
        return heard.values
            .filter { $0.seen > cutoff }
            .compactMap { h -> NearbyPeep? in
                guard let id = h.peepID, let bubble = h.bubble else { return nil }
                var peep = NearbyPeep(id: id, bubble: bubble)
                peep.isApproximate = true
                peep.signal = h.rssi
                return peep
            }
            .sorted { ($0.signal ?? -200) > ($1.signal ?? -200) }
    }

    /// Ask this person's phone to show them a "someone wants to see your PeepZ" notification.
    func nudge(_ peepID: String) {
        guard let entry = heard.first(where: { $0.value.peepID == peepID }) else { return }
        nudgeQueue.insert(entry.key)
        RemoteLog.send("presence: nudging \(peepID.prefix(4))")
        central.connect(entry.value.peripheral)
    }

    // MARK: - Advertising (being found)

    private var sharesBubble: Bool {
        guard let app, !app.bubble.isEmpty else { return false }
        return app.visibility == .everyone
    }

    private func refreshCard() {
        guard let app else { return }
        cardCache = (try? JSONEncoder().encode(Card(id: app.myID, bubble: app.bubble))) ?? Data()
    }

    private func refreshAdvertising() {
        guard peripheral.state == .poweredOn, let app else { return }
        addServiceIfNeeded()
        let mode: String?
        if appIsActive, app.visibility != .hidden {
            mode = "open"
        } else if !appIsActive, app.visibleWhenClosed, sharesBubble {
            mode = "closed"
        } else {
            mode = nil
        }
        guard mode != advertisingMode else { return }
        advertisingMode = mode
        peripheral.stopAdvertising()
        switch mode {
        case "open":
            peripheral.startAdvertising([CBAdvertisementDataServiceUUIDsKey: [Self.serviceUUID],
                                         CBAdvertisementDataLocalNameKey: Self.openMarker])
        case "closed":
            peripheral.startAdvertising([CBAdvertisementDataServiceUUIDsKey: [Self.serviceUUID]])
        default:
            break
        }
        RemoteLog.send("presence: advertising \(mode ?? "off")")
    }

    private func addServiceIfNeeded() {
        guard !serviceAdded else { return }
        serviceAdded = true
        let bubbleChar = CBMutableCharacteristic(type: Self.bubbleUUID, properties: [.read], value: nil, permissions: [.readable])
        let nudgeChar = CBMutableCharacteristic(type: Self.nudgeUUID, properties: [.write], value: nil, permissions: [.writeable])
        let service = CBMutableService(type: Self.serviceUUID, primary: true)
        service.characteristics = [bubbleChar, nudgeChar]
        peripheral.add(service)
    }

    // MARK: - Scanning (finding others)

    private func refreshScanning() {
        guard central.state == .poweredOn else { return }
        central.stopScan()
        // In the foreground, duplicates keep signal strength fresh. iOS ignores this in the background.
        central.scanForPeripherals(withServices: [Self.serviceUUID],
                                   options: [CBCentralManagerScanOptionAllowDuplicatesKey: appIsActive])
    }

    private func notify(id: String, title: String, body: String, key: String, quiet: TimeInterval) {
        guard !appIsActive else { return }
        let last = UserDefaults.standard.double(forKey: key)
        let now = Date().timeIntervalSince1970
        guard now - last > quiet else { return }
        UserDefaults.standard.set(now, forKey: key)
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: id, content: content, trigger: nil))
        RemoteLog.send("presence: notified \(id)")
    }

    private func readBubbleIfDue(_ id: UUID) {
        guard appIsActive, var h = heard[id], !h.reading else { return }
        if let last = h.lastRead, Date().timeIntervalSince(last) < 60 { return }
        h.reading = true
        heard[id] = h
        central.connect(h.peripheral)
    }
}

// MARK: - CBCentralManagerDelegate

extension PresenceService: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        RemoteLog.send("presence: bluetooth \(central.state == .poweredOn ? "on" : "state \(central.state.rawValue)")")
        refreshScanning()
    }

    func centralManager(_ central: CBCentralManager, willRestoreState dict: [String: Any]) {}

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral,
                        advertisementData: [String: Any], rssi RSSI: NSNumber) {
        let rssi = RSSI.intValue
        guard rssi != 127, rssi > -90 else { return }
        let isOpen = (advertisementData[CBAdvertisementDataLocalNameKey] as? String) == Self.openMarker
        var h = heard[peripheral.identifier] ?? Heard(peripheral: peripheral, rssi: rssi, seen: Date(), isOpen: isOpen)
        h.peripheral = peripheral
        h.rssi = rssi
        h.seen = Date()
        h.isOpen = isOpen
        heard[peripheral.identifier] = h

        if isOpen, rssi > -85 {
            notify(id: "peepz.nearby", title: "Someone nearby has PeepZ open 👀",
                   body: "Open PeepZ to see their bubble.", key: lastAlertKey, quiet: Self.quietPeriod)
        }
        readBubbleIfDue(peripheral.identifier)
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        peripheral.delegate = self
        peripheral.discoverServices([Self.serviceUUID])
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        finish(peripheral)
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        heard[peripheral.identifier]?.reading = false
    }

    private func finish(_ peripheral: CBPeripheral) {
        heard[peripheral.identifier]?.reading = false
        if heard[peripheral.identifier]?.lastRead == nil { heard[peripheral.identifier]?.lastRead = Date() }
        if !nudgeQueue.contains(peripheral.identifier) {
            central.cancelPeripheralConnection(peripheral)
        }
    }
}

// MARK: - CBPeripheralDelegate (talking to a phone we connected to)

extension PresenceService: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard let service = peripheral.services?.first(where: { $0.uuid == Self.serviceUUID }) else {
            finish(peripheral); return
        }
        peripheral.discoverCharacteristics([Self.bubbleUUID, Self.nudgeUUID], for: service)
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        let chars = service.characteristics ?? []
        if nudgeQueue.contains(peripheral.identifier), let nudge = chars.first(where: { $0.uuid == Self.nudgeUUID }) {
            peripheral.writeValue(Data([1]), for: nudge, type: .withResponse)
        }
        if let bubble = chars.first(where: { $0.uuid == Self.bubbleUUID }) {
            peripheral.readValue(for: bubble)
        } else {
            finish(peripheral)
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if characteristic.uuid == Self.bubbleUUID {
            if let data = characteristic.value, !data.isEmpty,
               let card = try? JSONDecoder().decode(Card.self, from: data),
               TextFilter.isAllowed(card.bubble.text) {
                if heard[peripheral.identifier]?.peepID == nil {
                    RemoteLog.send("presence: read bubble \(card.bubble.emoji) over Bluetooth")
                }
                heard[peripheral.identifier]?.peepID = card.id
                heard[peripheral.identifier]?.bubble = card.bubble
            } else {
                // They're not sharing their bubble (Friends-only, Hidden or empty).
                heard[peripheral.identifier]?.bubble = nil
            }
            heard[peripheral.identifier]?.lastRead = Date()
        }
        finish(peripheral)
    }

    func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
        guard characteristic.uuid == Self.nudgeUUID else { return }
        nudgeQueue.remove(peripheral.identifier)
        RemoteLog.send("presence: nudge \(error == nil ? "sent" : "failed")")
        central.cancelPeripheralConnection(peripheral)
    }
}

// MARK: - CBPeripheralManagerDelegate (other phones talking to us)

extension PresenceService: CBPeripheralManagerDelegate {
    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        if peripheral.state != .poweredOn { serviceAdded = false; advertisingMode = nil }
        refreshAdvertising()
    }

    func peripheralManager(_ peripheral: CBPeripheralManager, willRestoreState dict: [String: Any]) {
        serviceAdded = !((dict[CBPeripheralManagerRestoredStateServicesKey] as? [CBMutableService]) ?? []).isEmpty
    }

    func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveRead request: CBATTRequest) {
        guard request.characteristic.uuid == Self.bubbleUUID else {
            peripheral.respond(to: request, withResult: .requestNotSupported); return
        }
        // Only Everyone bubbles go out over Bluetooth: there's no way to check who's asking.
        let data = sharesBubble ? cardCache : Data()
        guard request.offset <= data.count else {
            peripheral.respond(to: request, withResult: .invalidOffset); return
        }
        request.value = data.subdata(in: request.offset..<data.count)
        peripheral.respond(to: request, withResult: .success)
    }

    func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveWrite requests: [CBATTRequest]) {
        guard let first = requests.first else { return }
        peripheral.respond(to: first, withResult: .success)
        guard requests.contains(where: { $0.characteristic.uuid == Self.nudgeUUID }) else { return }
        RemoteLog.send("presence: got a nudge")
        notify(id: "peepz.nudge", title: "Someone nearby wants to see your PeepZ 👋",
               body: "Open PeepZ so they can see your bubble above your head.",
               key: lastNudgeAlertKey, quiet: 120)
    }
}
