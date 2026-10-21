# Peepzi presence server (private family test)

In-memory Socket.IO presence for LAN testing with a few iPhones. **Does not persist profiles.** Not a production service.

## Quick start (Windows Cursor terminal)

```bash
cd server
npm install
npm start
```

Note the printed LAN IP (e.g. `192.168.1.42`) and port (`3847`). Put that IP in the app config — **never `localhost` on the iPhone**.

## Environment (optional)

| Variable | Default | Meaning |
|----------|---------|---------|
| `PEEPZI_PORT` | `3847` | Listen port |
| `PEEPZI_ROOM_CODE` | `PEEPZI-FAMILY-TEST` | Private room — keep out of production plans |
| `PEEPZI_HEARTBEAT_TTL_MS` | `20000` | Drop peers quieter than this |

## Events

- `presence:join` / `presence:update` / `presence:leave` / `presence:list`
- `presence:heartbeat` (client)
- `presence:error` / `presence:hello` (server)

See the root README for firewall + three-iPhone steps.
