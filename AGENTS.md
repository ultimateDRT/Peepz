# Peepzi — agent notes

Expo SDK 58 / React Native / TypeScript. **v0.1 must stay Expo Go compatible** (no custom native modules or config plugins that require a dev client).

## Stack choices for this repo

- Navigation: **React Navigation** native stack (`src/navigation/`), not Expo Router.
- Persistence: `@react-native-async-storage/async-storage`
- Theme: `src/theme` — dark background with purple/blue accents (product requirement)
- Future native work: stubs only under `modules/arkit` and `modules/nearby-interaction`

## Commands

```bash
npx expo install <package>  # prefer over raw npm for Expo-compatible versions
npx expo start              # Expo Go QR
npx tsc --noEmit            # typecheck
```

## Rules

- Do not add libraries that break Expo Go for v0.1.
- Prefer updating stub READMEs under `modules/` over wiring real ARKit/NI.
- Fetch current Expo docs when touching SDK APIs: https://docs.expo.dev/llms.txt
