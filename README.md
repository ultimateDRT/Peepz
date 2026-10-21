# Peepzi

Mobile social presence app — **create your Peep**, preview your floating chat-bubble profile, control when you are discoverable, and see other family phones on the same Wi‑Fi via a small LAN presence server.

**v0.1** targets **Expo SDK 57** (Expo Go compatible). No Bluetooth / ARKit native modules yet.

## What’s in v0.1

- Gen‑Z visual redesign (electric purple / cyan / lime / coral) with tab navigation
- Welcome + create/edit Peep (nickname, age, mood, emoji avatar, bubble theme)
- Cosmetic badges only (no popularity rankings); age private by default
- Home: animated Peep bubble, **Discoverable** (default **off**), AR Camera + Discover shortcuts
- Discover: connected Wi‑Fi test peers as bubble cards (distinct from future “nearby AR”)
- Camera: polished ARKit-ready placeholder (Expo Go safe)
- Settings: visibility, safety/blocking, reduce-motion accessibility
- Persistent random **device UUID** + AsyncStorage profile
- `/server` Socket.IO presence (in-memory only — **no profile persistence on the server**)

## Private family LAN test (3 iPhones) — Windows + Cursor

You need **two terminals** in Cursor: one for the presence server, one for Expo.

### 0. Same Wi‑Fi

Put the Windows PC and all three iPhones on the **same private Wi‑Fi** network.

### 1. Find your PC LAN IP

In a Windows terminal:

```bat
ipconfig
```

Use the **IPv4 Address** under your Wi‑Fi adapter (example: `192.168.1.42`).  
**Do not** use `127.0.0.1` / `localhost` on the phones — that points at the phone itself.

Optional: set the default in [`src/config/discovery.ts`](./src/config/discovery.ts) (`defaultServerHost`). You can also change the IP inside the app’s **Discover** screen.

### 2. Terminal A — presence server

```bat
cd server
npm install
npm start
```

You should see something like:

```text
Peepzi presence listening on 0.0.0.0:3847
Room code: PEEPZI-FAMILY-TEST
→ http://192.168.1.42:3847
```

Leave this running.

> The room code is for a **private family test only**. Keep it out of production plans.

### 3. Windows Firewall (private network)

Allow inbound TCP **3847** so phones can reach the PC:

1. Windows Security → Firewall → Advanced settings → Inbound Rules → New Rule  
2. Port → TCP → Specific local ports: `3847`  
3. Allow the connection  
4. Apply to **Private** profile (recommended for home Wi‑Fi)  
5. Name it e.g. `Peepzi Presence 3847`

Or from an **Admin** PowerShell:

```powershell
New-NetFirewallRule -DisplayName "Peepzi Presence 3847" -Direction Inbound -Protocol TCP -LocalPort 3847 -Action Allow -Profile Private
```

Quick check from another device on Wi‑Fi: open `http://YOUR_LAN_IP:3847` — you should get JSON `{"ok":true,...}`.

### 4. Terminal B — Expo app

From the repo root:

```bat
npm install
npx expo start
```

Scan the QR with Expo Go (SDK 57). If LAN Metro fails, use `npx expo start --tunnel` for the JS bundle — **presence still uses your LAN IP:3847**, not the Expo tunnel.

### 5. On each iPhone

1. Create / open your Peep (name, age, status).
2. Open **Discover** → set **Presence server LAN IP** to the PC IP from step 1 → **Save & reconnect**.
3. Confirm the status banner shows **Presence connected**.
4. Toggle **Discoverable** **on** only when you want to appear.
5. Other phones with Discoverable on should show up on **Discover** (not yourself).
6. Toggle Discoverable **off** — you disappear from others immediately.

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| Presence connection error | Firewall port 3847, correct LAN IP, same Wi‑Fi, server running |
| Empty Discover list | Both sides Discoverable **on**, same room code, wait a few seconds / Refresh |
| Expo QR won’t load | `npx expo start --tunnel` (Metro only); presence remains LAN |
| Duplicate peers | Shouldn’t happen — server keys by device UUID and replaces sockets on reconnect |

## Socket events

| Event | Direction | Role |
|-------|-----------|------|
| `presence:join` | client → server | Register / advertise (only listed if `discoverable`) |
| `presence:update` | client → server | Profile or visibility change |
| `presence:leave` | client → server | Leave / hide |
| `presence:list` | both | Snapshot of discoverable peers (excludes self / hidden) |
| `presence:heartbeat` | client → server | Keepalive; server expires quiet devices |
| `presence:error` | server → client | Validation / availability errors |

Server validates name length, age range, status enum, room code, and UUID. Hidden profiles cannot be fetched.

## Project layout

```
App.tsx
server/                 # Socket.IO presence (LAN family test)
src/
  theme/                # Design tokens (colours, radii, type, shadows)
  components/           # Screen, PillButton, PeepBubble, Card, …
  config/discovery.ts   # LAN host defaults + private room code
  presence/             # Socket.IO client + React context
  screens/              # Welcome, CreatePeep, Home, Discover, Camera, Profile, Settings
  navigation/           # Root stack + bottom tabs
  storage/              # profile, deviceId, serverHost
```

## Native roadmap (not in Expo Go)

See [`modules/README.md`](./modules/README.md).

## License

See [LICENSE](./LICENSE).
