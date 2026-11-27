import SwiftUI
import ARKit
import AVFoundation

/// Home screen: the camera, with bubbles floating above people, and your own bubble in the bottom bar.
///
/// Performance: the bubbles move every frame, so they live in `BubbleLayout` and are drawn by small
/// child views. This view's own body only re-runs when you change something (your bubble, a sheet...).
struct CameraHomeView: View {
    @Environment(AppState.self) private var app
    @Environment(NearbyService.self) private var nearby

    @State private var layout = BubbleLayout()
    @State private var editingBubble = false
    @State private var choosingVisibility = false
    @State private var selectedPeep: NearbyPeep?
    @State private var cameraDenied = false

    /// False in the iOS Simulator, where there is no camera.
    private let arSupported = ARWorldTrackingConfiguration.isSupported

    var body: some View {
        ZStack {
            if arSupported {
                ARCameraView(layout: layout, peeps: { [app, nearby] in
                    Self.currentPeeps(app: app, nearby: nearby)
                }, onSessionReady: { [nearby] session in
                    nearby.attachARSession(session)
                    nearby.start()
                })
                .ignoresSafeArea()
            } else {
                SimulatorBackdrop().ignoresSafeArea()
            }

            BubbleOverlay(layout: layout) { selectedPeep = $0 }
                .ignoresSafeArea()

            VStack(spacing: 0) {
                topBar
                UnlocatedTray(layout: layout) { selectedPeep = $0 }
                DebugPanel(layout: layout)
                Spacer()
                if cameraDenied { cameraDeniedCard }
                else { EmptyHint(layout: layout) }
                bottomBar
            }
        }
        .onAppear {
            cameraDenied = AVCaptureDevice.authorizationStatus(for: .video) == .denied
            if !arSupported {
                nearby.start()
                refreshSimulatorLayout()
            }
        }
        .onChange(of: app.demoMode) { if !arSupported { refreshSimulatorLayout() } }
        .onChange(of: app.blocked) { if !arSupported { refreshSimulatorLayout() } }
        .onChange(of: app.bubble) { nearby.refresh() }
        .onChange(of: app.visibility) { nearby.refresh() }
        .onChange(of: app.friends) { nearby.refresh() }
        .sheet(isPresented: $editingBubble) {
            BubbleEditSheet()
                .presentationDetents([.large])
        }
        .sheet(isPresented: $choosingVisibility) {
            VisibilitySheet()
                .presentationDetents([.medium, .large])
        }
        .sheet(item: $selectedPeep) { peep in
            PeepSheet(peep: peep)
                .presentationDetents([.height(360)])
        }
    }

    /// Everyone to show: real people nearby, plus demo people if Demo is on, minus anyone blocked.
    static func currentPeeps(app: AppState, nearby: NearbyService) -> [NearbyPeep] {
        var list = Array(nearby.peeps.values)
        if app.demoMode { list += SimulatedCrowd.peeps }
        return list
            .filter { !app.blocked.contains($0.id) }
            .map { peep in
                var p = peep
                p.isFriend = app.friends.contains(p.id)
                return p
            }
            .sorted { $0.id < $1.id }
    }

    /// Simulator only: a fixed scattered layout, since there's no camera or AR.
    private func refreshSimulatorLayout() {
        let size = UIScreen.main.bounds.size
        let columns: [CGFloat] = [0.3, 0.7, 0.45, 0.25, 0.72, 0.5]
        let rows: [CGFloat] = [0.2, 0.3, 0.45, 0.55, 0.62, 0.36]
        var placements: [String: Placement] = [:]
        let peeps = Self.currentPeeps(app: app, nearby: nearby)
        for (index, peep) in peeps.enumerated() {
            let i = index % columns.count
            let distance = peep.distance ?? Float(2 + i)
            placements[peep.id] = Placement(peep: peep,
                                            point: CGPoint(x: size.width * columns[i], y: size.height * rows[i]),
                                            scale: 0.9 - CGFloat(i % 3) * 0.1, distance: distance)
        }
        layout.placements = placements
        layout.nearbyCount = peeps.count
    }

    // MARK: Bars

    private var topBar: some View {
        HStack(alignment: .center) {
            Wordmark(size: 28)
            Spacer()
            HStack(spacing: 6) {
                Image(systemName: "person.2.fill").font(.system(size: 13, weight: .bold))
                NearbyCount(layout: layout)
            }
            .foregroundStyle(Theme.ink)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Capsule().fill(.white.opacity(0.9)))
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    private var bottomBar: some View {
        HStack(spacing: 10) {
            // Who can see me (the persistent dot).
            Button { choosingVisibility = true } label: {
                VStack(spacing: 4) {
                    VisibilityDot(visibility: app.visibility, size: 14)
                    Text(app.visibility.title)
                        .font(Theme.font(11, .bold))
                        .foregroundStyle(Theme.ink)
                }
                .frame(width: 64, height: 56)
                .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Theme.softGrey))
            }

            // My bubble: one tap to edit.
            Button { editingBubble = true } label: {
                HStack(spacing: 8) {
                    Text(app.bubble.emoji).font(.system(size: 22))
                    Text(app.bubble.isEmpty ? "Set your bubble" : app.bubble.text)
                        .font(Theme.font(15, .bold))
                        .foregroundStyle(app.bubble.color.text)
                        .lineLimit(1)
                    Spacer(minLength: 0)
                    Image(systemName: "pencil")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(app.bubble.color.text.opacity(0.7))
                }
                .padding(.horizontal, 14)
                .frame(height: 56)
                .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(app.bubble.color.fill))
                .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Theme.ink.opacity(app.bubble.color == .white ? 0.12 : 0)))
            }

            // Demo people on/off.
            Button { app.demoMode.toggle() } label: {
                VStack(spacing: 4) {
                    Image(systemName: app.demoMode ? "sparkles" : "sparkle")
                        .font(.system(size: 16, weight: .bold))
                    Text("Demo").font(Theme.font(11, .bold))
                }
                .foregroundStyle(app.demoMode ? .white : Theme.ink)
                .frame(width: 64, height: 56)
                .background(RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(app.demoMode ? Theme.lilac : Theme.softGrey))
            }
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 28, style: .continuous).fill(.white))
        .shadow(color: .black.opacity(0.12), radius: 16, y: 6)
        .padding(.horizontal, 14)
        .padding(.bottom, 8)
    }

    private var cameraDeniedCard: some View {
        VStack(spacing: 8) {
            Text("Peepz needs the camera to show bubbles.")
                .font(Theme.font(15, .bold))
            Button("Open Settings") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            .font(Theme.font(15, .bold))
            .foregroundStyle(Theme.pink)
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 20).fill(.white))
        .padding(.bottom, 12)
    }
}

/// Stand-in for the camera in the iOS Simulator.
struct SimulatorBackdrop: View {
    var body: some View {
        LinearGradient(colors: [Theme.sky.opacity(0.5), Theme.lilac.opacity(0.4), Theme.pink.opacity(0.3)],
                       startPoint: .top, endPoint: .bottom)
            .overlay(
                Text("Camera preview\n(Simulator)")
                    .font(Theme.font(14, .medium))
                    .foregroundStyle(Theme.ink.opacity(0.3))
                    .multilineTextAlignment(.center)
                    .offset(y: 140)
            )
    }
}

// MARK: - Fast-changing pieces (redraw on their own, not with the whole screen)

/// Bubbles pinned above people. Redraws every frame while you move.
private struct BubbleOverlay: View {
    let layout: BubbleLayout
    let onTap: (NearbyPeep) -> Void

    var body: some View {
        ZStack {
            ForEach(layout.placements.values.sorted { $0.peep.id < $1.peep.id }, id: \.peep.id) { place in
                BubbleView(bubble: place.peep.bubble, isPromo: place.peep.isPromo,
                           isFriend: place.peep.isFriend, distance: place.distance)
                    .scaleEffect(place.scale, anchor: .bottom)
                    .position(place.point)
                    .onTapGesture { onTap(place.peep) }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// People nearby whose position isn't known yet, with a tip for finding them.
/// People nearby who aren't in view. Deliberately not bubble-shaped: a bubble only ever appears
/// pinned above a phone that the camera can see.
private struct UnlocatedTray: View {
    let layout: BubbleLayout
    let onTap: (NearbyPeep) -> Void

    var body: some View {
        if let peep = layout.unlocated.first {
            let others = layout.unlocated.count - 1
            Text(hint(for: peep) + (others > 0 ? " (+\(others) more)" : ""))
                .font(Theme.font(12, .medium))
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.5), radius: 3)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 22)
                .padding(.top, 4)
        }
    }

    private func hint(for peep: NearbyPeep) -> String {
        let tip = peep.coaching ?? "point your camera at their phone"
        if let d = peep.distance { return "Someone \(BubbleView.format(d)) away · \(tip)" }
        return "Someone nearby · measuring distance…"
    }
}

/// Tap (or long-press) the "nearby" pill to see what the phone is measuring. For testing only.
private struct NearbyCount: View {
    let layout: BubbleLayout
    var body: some View {
        Text("\(layout.nearbyCount) nearby").font(Theme.font(14, .bold))
            .contentShape(Rectangle())
            .onTapGesture { layout.showDebug.toggle() }
    }
}

private struct DebugPanel: View {
    let layout: BubbleLayout
    @Environment(NearbyService.self) private var nearby

    var body: some View {
        if layout.showDebug {
            VStack(alignment: .leading, spacing: 4) {
                Text(nearby.debugSummary)
                ForEach(layout.debugLines, id: \.self) { Text($0) }
                ForEach(Array(nearby.events.enumerated()), id: \.offset) { Text($0.element).foregroundStyle(.white.opacity(0.75)) }
            }
            .font(.system(size: 10, design: .monospaced))
            .foregroundStyle(.white)
            .padding(8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 10).fill(.black.opacity(0.7)))
            .padding(.horizontal, 12)
            .padding(.top, 6)
            .textSelection(.enabled)
        }
    }
}

private struct EmptyHint: View {
    let layout: BubbleLayout
    @Environment(NearbyService.self) private var nearby

    var body: some View {
        if layout.nearbyCount == 0 {
            Text(nearby.statusText.isEmpty ? "Nobody nearby yet" : nearby.statusText)
                .font(Theme.font(14, .medium))
                .foregroundStyle(Theme.ink)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Capsule().fill(.white.opacity(0.9)))
                .padding(.bottom, 12)
        }
    }
}
