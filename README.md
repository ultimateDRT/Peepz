# Peepzi

Mobile social presence app — **create your Peep**, preview your floating profile bubble, and control when you are discoverable.

**v0.1** targets **Expo SDK 57** (Expo Go compatible). Future releases will add Apple ARKit floating bubbles and Nearby Interaction; those native modules are stubbed under [`modules/`](./modules/) and are **not** required to run this version.

Use Expo Go that matches SDK 57 (e.g. Expo Go `57.x` on the App Store). A newer Expo Go (SDK 58+) will report the project as incompatible until you upgrade this repo or install a matching Expo Go build.

## What’s in v0.1

- Welcome screen with Peepzi branding and tagline
- Create / edit Peep: name, age, status (`Available to chat` | `Just looking` | `Busy` | `Do not disturb`)
- Profile persisted with AsyncStorage
- Main screen: camera placeholder, Peep bubble preview, Edit Profile, Discoverable toggle (default **off**)
- Light, clean UI with soft purple/blue accents
- Peep shown as a **chat bubble** above a head (AR preview metaphor)

## Run from Windows (Cursor)

You do **not** need a Mac to try v0.1. Use Expo Go on an iPhone on the same network (or a tunnel).

### 1. Prerequisites

- [Node.js LTS](https://nodejs.org/) (18+)
- Cursor (or any terminal) on Windows
- iPhone with [Expo Go](https://apps.apple.com/app/expo-go/id982107779) installed
- Phone and PC on the same Wi‑Fi (preferred), or use tunnel mode below

### 2. Install and start

In Cursor’s terminal at the project root:

```bash
npm install
npx expo start
```

A QR code appears in the terminal (and in the browser Dev Tools page Expo opens).

### 3. Open on iPhone

1. Open the **Camera** app (or Expo Go) and scan the QR code.
2. Confirm it opens in **Expo Go**.
3. Wait for the JS bundle to load — you should land on Welcome (or Main if a profile was already saved).

### Same network issues?

If the QR code fails to connect from Windows:

```bash
npx expo start --tunnel
```

Tunnel mode is slower but works across networks. First run may prompt to install `@expo/ngrok`.

### Useful scripts

| Command | Purpose |
|---------|---------|
| `npx expo start` | Dev server + QR for Expo Go |
| `npx expo start --tunnel` | Dev server via tunnel |
| `npx tsc --noEmit` | Typecheck |

### Resetting your local Peep

Clear Expo Go’s data for Peepzi, or add a temporary call to `clearProfile()` from `src/storage/profileStorage.ts` during development.

## Project layout

```
App.tsx                 # Entry — profile provider + navigator
src/
  components/           # UI primitives (logo, bubble, forms, buttons)
  context/              # Profile React context
  navigation/           # React Navigation stack
  screens/              # Welcome, CreatePeep, Main
  storage/              # AsyncStorage helpers
  theme/                # Dark purple/blue theme tokens
  types/                # Peep profile types
modules/
  arkit/                # Future ARKit stub (Expo Go safe)
  nearby-interaction/   # Future NI stub (Expo Go safe)
```

## Native roadmap (not in Expo Go)

See [`modules/README.md`](./modules/README.md). Custom iOS builds will replace the camera placeholder and wire the Discoverable toggle to real Nearby Interaction.

## License

See [LICENSE](./LICENSE).
