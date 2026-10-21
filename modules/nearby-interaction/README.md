# Nearby Interaction module (stub)

**Status:** not implemented — Discoverable toggle only persists locally in v0.1.

## Future responsibility

- Start an NI session when Discoverable is on (with user permission + entitlement).
- Resolve peer tokens / distance / direction for floating bubbles.
- Tear down cleanly when Discoverable turns off or the app backgrounds.

## Expo Go note

Apple Nearby Interaction needs the Nearby Interaction entitlement and custom native code. Keep the JS toggle wired to AsyncStorage until a development build ships this module.
