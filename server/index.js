/**
 * Peepzi presence server — in-memory only.
 * Profiles are NEVER written to disk. Intended for private LAN family tests.
 *
 * Events: presence:join | presence:update | presence:leave | presence:list
 * Plus: presence:heartbeat (client → server), presence:error (server → client)
 */

const http = require('http');
const { Server } = require('socket.io');
const os = require('os');

const PORT = Number(process.env.PEEPZI_PORT || 3847);
/** Keep out of production plans — family test room only. */
const ROOM_CODE = process.env.PEEPZI_ROOM_CODE || 'PEEPZI-FAMILY-TEST';
const HEARTBEAT_TTL_MS = Number(process.env.PEEPZI_HEARTBEAT_TTL_MS || 20_000);
const SWEEP_INTERVAL_MS = 5_000;

const STATUSES = new Set(['available', 'looking', 'busy', 'dnd']);
const NAME_MAX = 32;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** @typedef {{ deviceId: string, name: string, age: number, status: string, discoverable: boolean, socketId: string, lastSeen: number }} PresenceEntry */

/** @type {Map<string, PresenceEntry>} deviceId → entry (room is fixed for this process) */
const presenceByDevice = new Map();
/** socketId → deviceId */
const socketToDevice = new Map();

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      ok: true,
      service: 'peepzi-presence',
      room: ROOM_CODE,
      discoverableCount: [...presenceByDevice.values()].filter((e) => e.discoverable)
        .length,
    }),
  );
});

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

function publicProfile(entry) {
  return {
    deviceId: entry.deviceId,
    name: entry.name,
    age: entry.age,
    status: entry.status,
  };
}

function listDiscoverable(excludeDeviceId) {
  const list = [];
  for (const entry of presenceByDevice.values()) {
    if (!entry.discoverable) continue;
    if (entry.deviceId === excludeDeviceId) continue;
    list.push(publicProfile(entry));
  }
  return list;
}

function emitListToSocket(socket, deviceId) {
  socket.emit('presence:list', { users: listDiscoverable(deviceId) });
}

function broadcastJoin(entry) {
  if (!entry.discoverable) return;
  io.to(ROOM_CODE).emit('presence:join', publicProfile(entry));
}

function broadcastUpdate(entry) {
  if (!entry.discoverable) return;
  io.to(ROOM_CODE).emit('presence:update', publicProfile(entry));
}

function broadcastLeave(deviceId) {
  io.to(ROOM_CODE).emit('presence:leave', { deviceId });
}

function validateRoom(roomCode) {
  return typeof roomCode === 'string' && roomCode === ROOM_CODE;
}

function validateDeviceId(deviceId) {
  return typeof deviceId === 'string' && UUID_RE.test(deviceId);
}

function sanitizeProfile(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid profile payload' };
  }
  const name =
    typeof raw.name === 'string' ? raw.name.trim().slice(0, NAME_MAX) : '';
  if (name.length < 2) {
    return { ok: false, error: 'Name must be 2–32 characters' };
  }
  const age = Number(raw.age);
  if (!Number.isInteger(age) || age < 13 || age > 120) {
    return { ok: false, error: 'Age must be an integer between 13 and 120' };
  }
  if (typeof raw.status !== 'string' || !STATUSES.has(raw.status)) {
    return { ok: false, error: 'Invalid status' };
  }
  const discoverable = Boolean(raw.discoverable);
  return {
    ok: true,
    profile: { name, age, status: raw.status, discoverable },
  };
}

function touch(entry) {
  entry.lastSeen = Date.now();
}

function removeDevice(deviceId, { notify } = { notify: true }) {
  const existing = presenceByDevice.get(deviceId);
  if (!existing) return;
  const wasDiscoverable = existing.discoverable;
  presenceByDevice.delete(deviceId);
  if (existing.socketId) socketToDevice.delete(existing.socketId);
  if (notify && wasDiscoverable) broadcastLeave(deviceId);
}

io.on('connection', (socket) => {
  socket.emit('presence:hello', {
    ok: true,
    serverTime: Date.now(),
    heartbeatTtlMs: HEARTBEAT_TTL_MS,
  });

  socket.on('presence:join', (payload, ack) => {
    try {
      if (!payload || typeof payload !== 'object') {
        socket.emit('presence:error', { message: 'Invalid join payload' });
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }
      if (!validateRoom(payload.roomCode)) {
        socket.emit('presence:error', { message: 'Invalid room code' });
        if (typeof ack === 'function') ack({ ok: false, error: 'room' });
        return;
      }
      if (!validateDeviceId(payload.deviceId)) {
        socket.emit('presence:error', { message: 'Invalid device id' });
        if (typeof ack === 'function') ack({ ok: false, error: 'deviceId' });
        return;
      }
      const parsed = sanitizeProfile(payload);
      if (!parsed.ok) {
        socket.emit('presence:error', { message: parsed.error });
        if (typeof ack === 'function') ack({ ok: false, error: parsed.error });
        return;
      }

      socket.join(ROOM_CODE);

      const previous = presenceByDevice.get(payload.deviceId);
      // Drop stale socket mapping on reconnect / replace duplicates
      if (previous?.socketId && previous.socketId !== socket.id) {
        socketToDevice.delete(previous.socketId);
        const oldSocket = io.sockets.sockets.get(previous.socketId);
        if (oldSocket) oldSocket.disconnect(true);
      }

      const wasDiscoverable = Boolean(previous?.discoverable);
      const entry = {
        deviceId: payload.deviceId,
        ...parsed.profile,
        socketId: socket.id,
        lastSeen: Date.now(),
      };
      presenceByDevice.set(payload.deviceId, entry);
      socketToDevice.set(socket.id, payload.deviceId);

      // Visibility transitions
      if (entry.discoverable && !wasDiscoverable) {
        broadcastJoin(entry);
      } else if (!entry.discoverable && wasDiscoverable) {
        broadcastLeave(entry.deviceId);
      } else if (entry.discoverable && wasDiscoverable) {
        broadcastUpdate(entry);
      }

      emitListToSocket(socket, entry.deviceId);
      if (typeof ack === 'function') {
        ack({ ok: true, users: listDiscoverable(entry.deviceId) });
      }
    } catch (err) {
      console.error('presence:join error', err);
      socket.emit('presence:error', { message: 'Join failed' });
      if (typeof ack === 'function') ack({ ok: false });
    }
  });

  socket.on('presence:update', (payload, ack) => {
    try {
      const deviceId = socketToDevice.get(socket.id);
      if (!deviceId) {
        socket.emit('presence:error', {
          message: 'Join before updating presence',
        });
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }
      if (payload?.roomCode != null && !validateRoom(payload.roomCode)) {
        socket.emit('presence:error', { message: 'Invalid room code' });
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }
      // Clients cannot impersonate another deviceId
      if (payload?.deviceId && payload.deviceId !== deviceId) {
        socket.emit('presence:error', { message: 'deviceId mismatch' });
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }

      const existing = presenceByDevice.get(deviceId);
      if (!existing) {
        socket.emit('presence:error', { message: 'Unknown session' });
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }

      const parsed = sanitizeProfile({
        name: payload?.name ?? existing.name,
        age: payload?.age ?? existing.age,
        status: payload?.status ?? existing.status,
        discoverable:
          payload?.discoverable != null
            ? payload.discoverable
            : existing.discoverable,
      });
      if (!parsed.ok) {
        socket.emit('presence:error', { message: parsed.error });
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }

      const wasDiscoverable = existing.discoverable;
      Object.assign(existing, parsed.profile);
      existing.socketId = socket.id;
      touch(existing);

      if (existing.discoverable && !wasDiscoverable) {
        broadcastJoin(existing);
      } else if (!existing.discoverable && wasDiscoverable) {
        // Off → remove from discovery immediately
        broadcastLeave(existing.deviceId);
      } else if (existing.discoverable) {
        broadcastUpdate(existing);
      }

      emitListToSocket(socket, deviceId);
      if (typeof ack === 'function') {
        ack({ ok: true, users: listDiscoverable(deviceId) });
      }
    } catch (err) {
      console.error('presence:update error', err);
      socket.emit('presence:error', { message: 'Update failed' });
      if (typeof ack === 'function') ack({ ok: false });
    }
  });

  socket.on('presence:leave', (_payload, ack) => {
    const deviceId = socketToDevice.get(socket.id);
    if (deviceId) {
      removeDevice(deviceId, { notify: true });
    }
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('presence:list', (payload, ack) => {
    const deviceId =
      socketToDevice.get(socket.id) ||
      (validateDeviceId(payload?.deviceId) ? payload.deviceId : null);
    // Only return currently discoverable peers — never leak hidden profiles
    const users = listDiscoverable(deviceId || undefined);
    socket.emit('presence:list', { users });
    if (typeof ack === 'function') ack({ ok: true, users });
  });

  socket.on('presence:heartbeat', () => {
    const deviceId = socketToDevice.get(socket.id);
    if (!deviceId) return;
    const entry = presenceByDevice.get(deviceId);
    if (entry) touch(entry);
  });

  // Block any attempt to fetch a specific non-discoverable profile
  socket.on('presence:get', (payload, ack) => {
    const targetId = payload?.deviceId;
    const entry =
      typeof targetId === 'string' ? presenceByDevice.get(targetId) : null;
    if (!entry || !entry.discoverable) {
      socket.emit('presence:error', {
        message: 'Profile not available',
      });
      if (typeof ack === 'function') ack({ ok: false });
      return;
    }
    if (typeof ack === 'function') ack({ ok: true, user: publicProfile(entry) });
  });

  socket.on('disconnect', () => {
    const deviceId = socketToDevice.get(socket.id);
    if (!deviceId) return;
    const entry = presenceByDevice.get(deviceId);
    // Only remove if this socket still owns the entry (reconnect may have replaced it)
    if (entry && entry.socketId === socket.id) {
      removeDevice(deviceId, { notify: true });
    } else {
      socketToDevice.delete(socket.id);
    }
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [deviceId, entry] of presenceByDevice.entries()) {
    if (now - entry.lastSeen > HEARTBEAT_TTL_MS) {
      console.log(`[expiry] removing stale device ${deviceId}`);
      removeDevice(deviceId, { notify: true });
      const sock = io.sockets.sockets.get(entry.socketId);
      if (sock) sock.disconnect(true);
    }
  }
}, SWEEP_INTERVAL_MS);

function lanAddresses() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const list of Object.values(nets)) {
    if (!list) continue;
    for (const net of list) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  return out;
}

server.listen(PORT, '0.0.0.0', () => {
  const addrs = lanAddresses();
  console.log(`Peepzi presence listening on 0.0.0.0:${PORT}`);
  console.log(`Room code: ${ROOM_CODE}`);
  console.log(`Heartbeat TTL: ${HEARTBEAT_TTL_MS}ms`);
  if (addrs.length) {
    console.log('Configure phones with one of these LAN IPs (not localhost):');
    for (const a of addrs) {
      console.log(`  → http://${a}:${PORT}   (socket URL: http://${a}:${PORT})`);
    }
  } else {
    console.log('No LAN IPv4 detected — check Wi‑Fi / ipconfig on Windows.');
  }
});
