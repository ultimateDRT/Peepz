import SwiftUI
import ARKit
import AVFoundation

/// Home screen: the camera, with bubbles floating above people, and your own bubble in the bottom bar.
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

    private var visiblePeeps: [NearbyPeep] {
        var list = Array(nearby.peeps.values)
        if app.demoMode {
            list += SimulatedCrowd.peeps.map { peep in
                var p = peep
                p.isFriend = app.friends.contains(p.id)
                return p
            }
        }
        return list
            .filter { !app.blocked.contains($0.id) }
            .sorted { $0.id < $1.id }
    }

    var body: some View {
        ZStack {
            if arSupported {
                ARCameraView(peeps: visiblePeeps, layout: layout) { session in
                    nearby.arSession = session
                    nearby.start()
                }
                .ignoresSafeArea()
            } else {
                SimulatorBackdrop().ignoresSafeArea()
            }

            bubbleOverlay.ignoresSafeArea()

            VStack(spacing: 0) {
                topBar
                Spacer()
                if cameraDenied { cameraDeniedCard }
                else if visiblePeeps.isEmpty { emptyHint }
                bottomBar
            }
        }
        .onAppear {
            cameraDenied = AVCaptureDevice.authorizationStatus(for: .video) == .denied
            if !arSupported { nearby.start() }
        }
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

    // MARK: Bubbles

    private var bubbleOverlay: some View {
        GeometryReader { geo in
            ForEach(Array(visiblePeeps.enumerated()), id: \.element.id) { index, peep in
                if let place = placement(for: peep, index: index, in: geo.size) {
                    BubbleView(bubble: peep.bubble, isPromo: peep.isPromo, isFriend: peep.isFriend, distance: place.distance)
                        .scaleEffect(place.scale, anchor: .bottom)
                        .position(place.point)
                        .onTapGesture { selectedPeep = peep }
                        .animation(.linear(duration: 0.1), value: place)
                        .transition(.scale.combined(with: .opacity))
                }
            }
        }
    }

    private func placement(for peep: NearbyPeep, index: Int, in size: CGSize) -> Placement? {
        if arSupported { return layout.placements[peep.id] }
        // Simulator: a fixed scattered layout.
        let columns: [CGFloat] = [0.3, 0.7, 0.45, 0.25, 0.72, 0.5]
        let rows: [CGFloat] = [0.2, 0.3, 0.45, 0.55, 0.62, 0.36]
        let i = index % columns.count
        return Placement(point: CGPoint(x: size.width * columns[i], y: size.height * rows[i]),
                         scale: 0.9 - CGFloat(i % 3) * 0.1, distance: peep.distance ?? Float(2 + i))
    }

    // MARK: Bars

    private var topBar: some View {
        HStack(alignment: .center) {
            Wordmark(size: 28)
            Spacer()
            HStack(spacing: 6) {
                Image(systemName: "person.2.fill").font(.system(size: 13, weight: .bold))
                Text("\(visiblePeeps.count) nearby").font(Theme.font(14, .bold))
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

    private var emptyHint: some View {
        Text(nearby.statusText.isEmpty ? "Nobody nearby yet" : nearby.statusText)
            .font(Theme.font(14, .medium))
            .foregroundStyle(Theme.ink)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Capsule().fill(.white.opacity(0.9)))
            .padding(.bottom, 12)
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
