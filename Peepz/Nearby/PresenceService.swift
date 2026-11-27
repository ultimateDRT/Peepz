import Foundation
import CoreBluetooth
import UserNotifications
import UIKit

/// Lets your phone notice, even when Peepz is closed, that someone nearby has Peepz open.
///
/// - While Peepz is on screen and you're not Hidden, the phone sends out a tiny Bluetooth signal
///   that just says "Peepz is open here". No ID, no bubble, nothing about who you are.
/// - In the background, the phone listens for that signal and shows a notification.
///   At most one every 15 minutes, and never while Peepz is already open.
final class PresenceService: NSObject {
    static let serviceUUID = CBUUID(string: "D86C534A-977B-442C-ABC9-A1B71C07E83E")
    static let quietPeriod: TimeInterval = 15 * 60

    private var central: CBCentralManager!
    private var peripheral: CBPeripheralManager!
    private var shouldAdvertise = false
    private var appIsActive = true
    private let lastAlertKey = "peepz.lastNearbyAlert"

    override init() {
        super.init()
        central = CBCentralManager(delegate: self, queue: nil,
                                   options: [CBCentralManagerOptionRestoreIdentifierKey: "peepz.presence.central"])
        peripheral = CBPeripheralManager(delegate: self, queue: nil)
    }

    /// Ask once for permission to show the "someone's nearby" notification.
    static func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    /// Call when the app comes on screen or goes away, or visibility changes.
    func update(appActive: Bool, visible: Bool) {
        appIsActive = appActive
        shouldAdvertise = appActive && visible
        refreshAdvertising()
        refreshScanning()
    }

    private func refreshAdvertising() {
        guard peripheral.state == .poweredOn else { return }
        if shouldAdvertise, !peripheral.isAdvertising {
            peripheral.startAdvertising([CBAdvertisementDataServiceUUIDsKey: [Self.serviceUUID]])
            RemoteLog.send("presence: advertising")
        } else if !shouldAdvertise, peripheral.isAdvertising {
            peripheral.stopAdvertising()
        }
    }

    private func refreshScanning() {
        guard central.state == .poweredOn else { return }
        // Always listen for the specific Peepz signal; iOS allows that in the background.
        if !central.isScanning {
            central.scanForPeripherals(withServices: [Self.serviceUUID], options: nil)
        }
    }

    private func someoneNearby() {
        guard !appIsActive else { return }
        let last = UserDefaults.standard.double(forKey: lastAlertKey)
        let now = Date().timeIntervalSince1970
        guard now - last > Self.quietPeriod else { return }
        UserDefaults.standard.set(now, forKey: lastAlertKey)
        RemoteLog.send("presence: notified someone nearby")

        let content = UNMutableNotificationContent()
        content.title = "Someone nearby has PeepZ open 👀"
        content.body = "Open PeepZ to see their bubble."
        content.sound = .default
        let request = UNNotificationRequest(identifier: "peepz.nearby", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
}

extension PresenceService: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        RemoteLog.send("presence: bluetooth \(central.state == .poweredOn ? "on" : "state \(central.state.rawValue)")")
        refreshScanning()
    }

    func centralManager(_ central: CBCentralManager, willRestoreState dict: [String: Any]) {}

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral,
                        advertisementData: [String: Any], rssi RSSI: NSNumber) {
        // Very weak signals are probably across the street, not "nearby".
        guard RSSI.intValue > -85, RSSI.intValue != 127 else { return }
        someoneNearby()
    }
}

extension PresenceService: CBPeripheralManagerDelegate {
    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        refreshAdvertising()
    }
}
