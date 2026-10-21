/**
 * LAN presence config for private family testing.
 *
 * IMPORTANT: set `defaultServerHost` to your Windows PC’s Wi‑Fi IPv4 from `ipconfig`.
 * iPhones cannot reach `localhost` / `127.0.0.1` on the PC.
 *
 * Room code is intentional for a private test — do not treat as a production auth model.
 */

export const DISCOVERY_DEFAULTS = {
  /** ← Change this to your PC LAN IP before testing on phones */
  defaultServerHost: '192.168.1.100',
  serverPort: 3847,
  /** Private family test room — keep out of production plans */
  roomCode: 'PEEPZI-FAMILY-TEST',
  heartbeatIntervalMs: 8_000,
  reconnectDelayMs: 2_000,
} as const;

export function buildServerUrl(host: string, port = DISCOVERY_DEFAULTS.serverPort): string {
  const cleaned = host.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `http://${cleaned}:${port}`;
}
