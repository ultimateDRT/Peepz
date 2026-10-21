import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { io, type Socket } from 'socket.io-client';
import {
  buildServerUrl,
  DISCOVERY_DEFAULTS,
} from '../config/discovery';
import { useProfile } from '../context/ProfileContext';
import { getOrCreateDeviceId } from '../storage/deviceId';
import { loadServerHost, saveServerHost } from '../storage/serverHostStorage';
import type { PeepProfile } from '../types/peep';
import { PEEP_STATUSES, type PeepStatus } from '../types/peep';
import type { ConnectionStatus, DiscoveryUser } from './types';

type PresenceContextValue = {
  deviceId: string | null;
  serverHost: string;
  setServerHost: (host: string) => Promise<void>;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  peers: DiscoveryUser[];
  clearError: () => void;
  refreshPeers: () => void;
};

const PresenceContext = createContext<PresenceContextValue | null>(null);

function isPeepStatus(value: unknown): value is PeepStatus {
  return typeof value === 'string' && (PEEP_STATUSES as readonly string[]).includes(value);
}

function normalizeUser(raw: unknown): DiscoveryUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  if (typeof u.deviceId !== 'string') return null;
  if (typeof u.name !== 'string') return null;
  if (typeof u.age !== 'number' || !Number.isFinite(u.age)) return null;
  if (!isPeepStatus(u.status)) return null;
  return {
    deviceId: u.deviceId,
    name: u.name.slice(0, 32),
    age: u.age,
    status: u.status,
  };
}

function upsertPeer(list: DiscoveryUser[], user: DiscoveryUser): DiscoveryUser[] {
  const idx = list.findIndex((p) => p.deviceId === user.deviceId);
  if (idx === -1) return [...list, user];
  const next = list.slice();
  next[idx] = user;
  return next;
}

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [serverHost, setServerHostState] = useState<string>(
    DISCOVERY_DEFAULTS.defaultServerHost,
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [peers, setPeers] = useState<DiscoveryUser[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const profileRef = useRef<PeepProfile | null>(profile);
  const deviceIdRef = useRef<string | null>(null);
  const hostRef = useRef<string>(serverHost);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    hostRef.current = serverHost;
  }, [serverHost]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [id, host] = await Promise.all([
        getOrCreateDeviceId(),
        loadServerHost(),
      ]);
      if (cancelled) return;
      deviceIdRef.current = id;
      setDeviceId(id);
      setServerHostState(host);
      hostRef.current = host;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const applyList = useCallback((users: unknown, selfId: string | null) => {
    if (!Array.isArray(users)) return;
    const next: DiscoveryUser[] = [];
    const seen = new Set<string>();
    for (const raw of users) {
      const user = normalizeUser(raw);
      if (!user) continue;
      if (selfId && user.deviceId === selfId) continue;
      if (seen.has(user.deviceId)) continue;
      seen.add(user.deviceId);
      next.push(user);
    }
    setPeers(next);
  }, []);

  const stopSocket = useCallback(() => {
    clearHeartbeat();
    const sock = socketRef.current;
    socketRef.current = null;
    if (sock) {
      sock.removeAllListeners();
      sock.disconnect();
    }
  }, [clearHeartbeat]);

  const emitJoinOrUpdate = useCallback(
    (sock: Socket, p: PeepProfile, id: string) => {
      const payload = {
        roomCode: DISCOVERY_DEFAULTS.roomCode,
        deviceId: id,
        name: p.name,
        age: p.age,
        status: p.status,
        discoverable: p.discoverable,
      };
      sock.emit('presence:join', payload);
    },
    [],
  );

  const startHeartbeat = useCallback((sock: Socket) => {
    clearHeartbeat();
    heartbeatRef.current = setInterval(() => {
      if (sock.connected) sock.emit('presence:heartbeat');
    }, DISCOVERY_DEFAULTS.heartbeatIntervalMs);
  }, [clearHeartbeat]);

  const connect = useCallback(() => {
    const id = deviceIdRef.current;
    const p = profileRef.current;
    if (!id || !p) return;

    stopSocket();
    setConnectionStatus('connecting');
    setConnectionError(null);

    const url = buildServerUrl(hostRef.current);
    const sock = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: DISCOVERY_DEFAULTS.reconnectDelayMs,
      timeout: 10_000,
      autoConnect: true,
      forceNew: true,
    });
    socketRef.current = sock;

    sock.on('connect', () => {
      setConnectionStatus('connected');
      setConnectionError(null);
      emitJoinOrUpdate(sock, profileRef.current!, id);
      startHeartbeat(sock);
    });

    sock.on('disconnect', (reason) => {
      clearHeartbeat();
      setPeers([]);
      if (reason === 'io client disconnect') {
        setConnectionStatus('disconnected');
      } else {
        setConnectionStatus('reconnecting');
      }
    });

    sock.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
    });

    sock.on('reconnect', () => {
      setConnectionStatus('connected');
      setConnectionError(null);
      const current = profileRef.current;
      if (current && deviceIdRef.current) {
        emitJoinOrUpdate(sock, current, deviceIdRef.current);
      }
      startHeartbeat(sock);
    });

    sock.on('connect_error', (err) => {
      setConnectionStatus('error');
      setConnectionError(
        err?.message
          ? `Cannot reach ${url} — ${err.message}`
          : `Cannot reach ${url}`,
      );
    });

    sock.on('presence:error', (payload: { message?: string }) => {
      setConnectionError(payload?.message || 'Presence error');
    });

    sock.on('presence:list', (payload: { users?: unknown }) => {
      applyList(payload?.users, deviceIdRef.current);
    });

    sock.on('presence:join', (raw: unknown) => {
      const user = normalizeUser(raw);
      if (!user || user.deviceId === deviceIdRef.current) return;
      setPeers((prev) => upsertPeer(prev, user));
    });

    sock.on('presence:update', (raw: unknown) => {
      const user = normalizeUser(raw);
      if (!user || user.deviceId === deviceIdRef.current) return;
      setPeers((prev) => upsertPeer(prev, user));
    });

    sock.on('presence:leave', (payload: { deviceId?: string }) => {
      const leaveId = payload?.deviceId;
      if (!leaveId) return;
      setPeers((prev) => prev.filter((u) => u.deviceId !== leaveId));
    });
  }, [applyList, clearHeartbeat, emitJoinOrUpdate, startHeartbeat, stopSocket]);

  // Connect once we have deviceId + profile; reconnect when host changes
  useEffect(() => {
    if (!deviceId || !profile) {
      stopSocket();
      setConnectionStatus('idle');
      setPeers([]);
      return;
    }
    connect();
    return () => {
      // On teardown leave if we were discoverable
      const sock = socketRef.current;
      if (sock?.connected) {
        sock.emit('presence:leave');
      }
      stopSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, serverHost, Boolean(profile)]);

  // Sync profile / discoverable changes to the server
  useEffect(() => {
    const sock = socketRef.current;
    const id = deviceIdRef.current;
    if (!sock?.connected || !profile || !id) return;

    sock.emit('presence:update', {
      roomCode: DISCOVERY_DEFAULTS.roomCode,
      deviceId: id,
      name: profile.name,
      age: profile.age,
      status: profile.status,
      discoverable: profile.discoverable,
    });

    // Immediate local clear of peers' view of us is server-side;
    // if we turned off, we still see others who are discoverable.
    if (!profile.discoverable) {
      // No local peer wipe required — peers list is "others"
    }
  }, [profile]);

  // App background: still heartbeating while JS runs; on inactive leave discoverable?
  // Spec: on visibility off remove immediately — that's the Discoverable toggle.
  // Also leave cleanly when app goes to background for longer sessions optional —
  // keep connection; expiry handles kill.

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      const sock = socketRef.current;
      if (state === 'active' && sock && !sock.connected && deviceIdRef.current && profileRef.current) {
        connect();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [connect]);

  const setServerHost = useCallback(
    async (host: string) => {
      const cleaned = host.trim();
      if (!cleaned) return;
      await saveServerHost(cleaned);
      hostRef.current = cleaned;
      setServerHostState(cleaned);
    },
    [],
  );

  const refreshPeers = useCallback(() => {
    const sock = socketRef.current;
    if (!sock?.connected) return;
    sock.emit('presence:list', { deviceId: deviceIdRef.current });
  }, []);

  const clearError = useCallback(() => setConnectionError(null), []);

  const value = useMemo(
    () => ({
      deviceId,
      serverHost,
      setServerHost,
      connectionStatus,
      connectionError,
      peers,
      clearError,
      refreshPeers,
    }),
    [
      deviceId,
      serverHost,
      setServerHost,
      connectionStatus,
      connectionError,
      peers,
      clearError,
      refreshPeers,
    ],
  );

  return (
    <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
  );
}

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  return ctx;
}
