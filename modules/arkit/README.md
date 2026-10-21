# ARKit module (stub)

**Status:** not implemented — Expo Go compatible app uses a camera placeholder.

## Future responsibility

- Host an `ARView` / RealityKit scene behind the main screen.
- Place a Peep bubble billboard above detected nearby peers (world anchors).
- Sync bubble content with the local `PeepProfile` (name, age, status).

## Expo Go note

Any ARKit usage requires a **custom native build**. Do not import native ARKit APIs from the JS app until that build exists.
