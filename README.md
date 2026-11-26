# Peepz

Augmented social media for iPhone. Point your camera at people around you and see their status bubble floating above their head.

Native Swift / SwiftUI app. iOS 17+.

## What's in this first version

- **Onboarding:** welcome, set your bubble, set your visibility.
- **Your bubble:** status up to 40 characters, an emoji, a colour, and quick picks ("Single and looking", "Bored", "Ask me about my band"...).
- **Visibility:** Hidden / Friends / Everyone. Starts on Hidden. A small dot in the bottom bar always shows who can see you.
- **Camera home screen:** live camera with ARKit world tracking. Bubbles stay pinned in space as you move. Tap a bubble to add a friend, block or report.
- **Real nearby people:** other iPhones running Peepz are found over Bluetooth / Wi-Fi (MultipeerConnectivity, no internet or server). The UWB chip (Nearby Interaction, iPhone 11 and newer) measures distance and direction to them, and on newer iPhones camera assistance gives an exact position in the AR scene.
- **Demo mode:** six pretend people placed around you (some behind you, turn around) so you can try it with one phone. Toggle with the Demo button.

## How the distance between phones works

ARToolKit was the first idea, but it tracks printed markers, not other phones. Apple's own frameworks do this job:

1. **MultipeerConnectivity** finds nearby phones running Peepz. You only broadcast when you're set to Friends or Everyone.
2. Phones swap a random anonymous ID, then their bubble if your audience setting allows it.
3. Phones swap **Nearby Interaction** tokens, and the UWB chip reports distance and direction about 10 times a second.
4. With **camera assistance** (ARKit + Nearby Interaction), that becomes a 3D position in the camera view, and the bubble is drawn above it.

Older iPhones without UWB still see bubbles, just in a row at the top rather than above the right person.

Testing real distance needs **two iPhones** with Peepz installed.

## Building without a Mac

There is no Xcode project checked in. `project.yml` describes it, and [XcodeGen](https://github.com/yonaskolb/XcodeGen) generates it on a cloud Mac.

| Workflow | When | Needs |
|---|---|---|
| **Build** (`.github/workflows/build.yml`) | Every push | Nothing. Checks the code compiles and gives you an unsigned `Peepz-unsigned.ipa` to download. |
| **TestFlight** (`.github/workflows/testflight.yml`) | Run by hand from the Actions tab | Paid Apple Developer account and 4 secrets (listed at the top of the file). Puts the app in TestFlight on your iPhone. |

### Getting it on your iPhone with TestFlight

1. Join the Apple Developer Program at developer.apple.com/programs ($99 a year, approval usually takes a day or two).
2. In App Store Connect, create a new app called Peepz with bundle ID `com.peepz.app`.
3. In App Store Connect > Users and Access > Integrations, create an API key with Admin access and download the `.p8` file.
4. In this repo on GitHub: Settings > Secrets and variables > Actions, add `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID` and `ASC_KEY_P8`.
5. Actions tab > TestFlight > Run workflow.
6. Install the TestFlight app on your iPhone, and Peepz shows up there once Apple finishes processing (10 to 30 minutes).

### With a Mac (optional)

```
brew install xcodegen
xcodegen generate
open Peepz.xcodeproj
```

## Still to do

- Rotate the anonymous ID regularly so nobody can be tracked across days.
- Real friends system (right now friends are stored on your phone only).
- Moderation backend for reports. The text filter is a placeholder.
- Age checks (18+ advised if dating is a use case).
- Tune bubble height above heads on real devices.
- App icon is cut from the preferred logo PDF (a JPEG). Swap in a vector export for a crisper icon.
