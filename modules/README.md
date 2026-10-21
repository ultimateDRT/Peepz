# Native modules (future)

This folder is a **placeholder** for custom native iOS (and later Android) code that cannot ship in Expo Go.

## Planned modules

| Folder | Purpose | Earliest target |
|--------|---------|-----------------|
| `arkit/` | Floating Peep bubbles in world space via Apple ARKit | Post–v0.1, custom dev client / EAS build |
| `nearby-interaction/` | Discover nearby users with Apple Nearby Interaction (U1) | Same — requires physical iPhone + entitlements |

## Rules for v0.1

- **Do not** add Expo config plugins, `expo-modules`, or native code that requires a custom binary.
- Keep Peepzi runnable in **Expo Go**.
- Stub TypeScript APIs may live here for design clarity; they must no-op or throw a clear “not available in Expo Go” error until a development build exists.

## Integration sketch (later)

1. Create an Expo development build (`npx expo prebuild` / EAS Build).
2. Implement Swift bridges under each module folder.
3. Expose a JS API (e.g. `startNearbySession()`, `attachPeepAnchor()`).
4. Swap the camera placeholder on `MainScreen` for the real AR view when `NativeModules` reports availability.
