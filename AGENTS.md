# Peepzi — agent notes

Expo SDK **57** / React Native / TypeScript. **v0.1 must stay Expo Go compatible** (no custom native modules or config plugins that require a dev client).

## Stack choices for this repo

- Navigation: **React Navigation** native stack + bottom tabs (`src/navigation/`), not Expo Router.
- Persistence: `@react-native-async-storage/async-storage`
- Theme: `src/theme` — Gen‑Z light gradients (electric purple / cyan / lime / coral / lavender)
- Peep visual: speech bubble (nickname + mood) above an emoji head — `PeepBubble`
- Presence: Socket.IO client (`src/presence`) + `/server` LAN family test (APIs stay minimal: name/age/status/discoverable)
- Future native work: stubs only under `modules/arkit` and `modules/nearby-interaction`

## Commands

```bash
npx expo install <package>  # prefer over raw npm for Expo-compatible versions
npx expo start              # Expo Go QR (try --port 19001 if busy)
npx tsc --noEmit            # typecheck
npm run server              # presence server on :3847
```

## Rules

- Do not add libraries that break Expo Go for v0.1.
- Prefer updating stub READMEs under `modules/` over wiring real ARKit/NI.
- Discoverable defaults **off**; age private by default; no popularity rankings / random DMs.
- Preserve Socket.IO presence event contracts unless explicitly changing the family-test protocol.
- Fetch current Expo docs when touching SDK APIs: https://docs.expo.dev/llms.txt
