import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { PairingStore } from "./pairing-store";

const PORT = Number(process.env.PORT ?? 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

interface PeerMeta {
  id: string;
  name: string;
  avatar: string;
  room: string;
  lastSeen: number;
}

const app = express();
app.use(
  cors({
    origin: CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "peer-beam-signaling" });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN.split(",").map((o) => o.trim()),
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e6,
  pingTimeout: 20000,
  pingInterval: 10000,
});

const peers = new Map<string, PeerMeta>();
const pairingStore = new PairingStore();

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 120),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many requests" });
  },
});

app.use(limiter);

function roomPeers(room: string, excludeId?: string): PeerMeta[] {
  const list: PeerMeta[] = [];
  for (const peer of peers.values()) {
    if (peer.room === room && peer.id !== excludeId) {
      list.push(peer);
    }
  }
  return list;
}

function broadcastPeers(room: string) {
  const byRoom = new Map<string, PeerMeta[]>();
  for (const peer of peers.values()) {
    const arr = byRoom.get(peer.room) ?? [];
    arr.push(peer);
    byRoom.set(peer.room, arr);
  }
  for (const [r, list] of byRoom) {
    io.to(r).emit("peers", list.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      online: true,
    })));
  }
}

function sanitizeRoom(room: unknown): string | null {
  if (typeof room !== "string") return null;
  if (!/^[a-zA-Z0-9_-]{2,64}$/.test(room)) return null;
  return room;
}

function sanitizeId(id: unknown): string | null {
  if (typeof id !== "string") return null;
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(id)) return null;
  return id;
}

function sanitizeName(name: unknown): string {
  if (typeof name !== "string") return "Anonymous";
  return name.trim().slice(0, 32) || "Anonymous";
}

io.on("connection", (socket: Socket) => {
  let peerId: string | null = null;
  let room: string | null = null;

  socket.on("join", (payload: { id?: string; name?: string; avatar?: string; room?: string }) => {
    const id = sanitizeId(payload?.id);
    const r = sanitizeRoom(payload?.room);
    if (!id || !r) {
      socket.emit("error", { message: "Invalid join payload" });
      return;
    }

    peerId = id;
    room = r;
    peers.set(socket.id, {
      id,
      name: sanitizeName(payload?.name),
      avatar: typeof payload?.avatar === "string" ? payload.avatar.slice(0, 32) : "device",
      room: r,
      lastSeen: Date.now(),
    });

    socket.join(r);
    socket.emit("joined", { id, room: r, peers: roomPeers(r, id) });
    io.to(r).emit("peer-joined", {
      id,
      name: sanitizeName(payload?.name),
      avatar: payload?.avatar ?? "device",
      online: true,
    });
    broadcastPeers(r);
  });

  socket.on("signal", (payload: {
    type?: string;
    from?: string;
    to?: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  }) => {
    const from = sanitizeId(payload?.from);
    const to = sanitizeId(payload?.to);
    const type = payload?.type;
    if (!from || !to || !type || !["offer", "answer", "ice"].includes(type)) return;

    const meta = peers.get(socket.id);
    if (!meta || meta.id !== from) return;

    meta.lastSeen = Date.now();

    for (const [sid, p] of peers) {
      if (p.id === to && p.room === meta.room) {
        io.to(sid).emit("signal", {
          type,
          from,
          to,
          sdp: payload.sdp,
          candidate: payload.candidate,
        });
        break;
      }
    }
  });

  socket.on("heartbeat", () => {
    const meta = peers.get(socket.id);
    if (meta) meta.lastSeen = Date.now();
  });

  socket.on(
    "pairing-code",
    (payload: { type?: string; code?: string; from?: string }) => {
      const meta = peers.get(socket.id);
      if (!meta || !room || meta.id !== sanitizeId(payload?.from)) return;

      const code = typeof payload?.code === "string" ? payload.code.trim() : "";
      const result = pairingStore.register(meta.room, meta.id, socket.id, code);
      if (!result.ok) {
        socket.emit("pairing-failed", {
          type: "pairing-failed",
          message: result.reason,
          reason: "register",
        });
        return;
      }
      socket.emit("pairing-code-ack", { type: "pairing-code-ack", code, from: meta.id });
    }
  );

  socket.on(
    "pairing-verify",
    (payload: { type?: string; code?: string; deviceId?: string }) => {
      const meta = peers.get(socket.id);
      if (!meta || !room) return;

      const receiverId = sanitizeId(payload?.deviceId);
      if (!receiverId || receiverId !== meta.id) {
        socket.emit("pairing-failed", {
          type: "pairing-failed",
          message: "Invalid device",
          reason: "device",
        });
        return;
      }

      const code = typeof payload?.code === "string" ? payload.code.trim() : "";
      const result = pairingStore.verify(meta.room, code, receiverId);
      if (!result.ok) {
        socket.emit("pairing-failed", {
          type: "pairing-failed",
          message: result.reason,
          reason: "verify",
        });
        return;
      }

      const hostMeta = [...peers.values()].find(
        (p) => p.id === result.hostId && p.room === meta.room
      );
      if (!hostMeta) {
        socket.emit("pairing-failed", {
          type: "pairing-failed",
          message: "Host offline",
          reason: "host-offline",
        });
        return;
      }

      const successHost = {
        type: "pairing-success" as const,
        sessionId: result.sessionId,
        peerId: receiverId,
        peerName: meta.name,
        peerAvatar: meta.avatar,
      };
      const successReceiver = {
        type: "pairing-success" as const,
        sessionId: result.sessionId,
        peerId: result.hostId,
        peerName: hostMeta.name,
        peerAvatar: hostMeta.avatar,
      };

      io.to(result.hostSocketId).emit("pairing-success", successHost);
      socket.emit("pairing-success", successReceiver);
    }
  );

  socket.on("pairing-cancel", (payload: { code?: string; from?: string }) => {
    const meta = peers.get(socket.id);
    if (!meta || !room) return;
    const code = typeof payload?.code === "string" ? payload.code.trim() : "";
    const from = sanitizeId(payload?.from);
    if (!code || from !== meta.id) return;
    pairingStore.cancel(meta.room, meta.id, code);
  });

  socket.on("disconnect", () => {
    const meta = peers.get(socket.id);
    if (meta && room) {
      peers.delete(socket.id);
      io.to(meta.room).emit("peer-left", { id: meta.id });
      broadcastPeers(meta.room);
    }
  });
});

setInterval(() => {
  pairingStore.purgeExpired();
  const now = Date.now();
  const timeout = Number(process.env.INACTIVE_TIMEOUT_MS ?? 5 * 60 * 1000);
  for (const [sid, meta] of peers) {
    if (now - meta.lastSeen > timeout) {
      const sock = io.sockets.sockets.get(sid);
      if (sock) sock.disconnect(true);
      peers.delete(sid);
      io.to(meta.room).emit("peer-left", { id: meta.id });
    }
  }
  const rooms = new Set([...peers.values()].map((p) => p.room));
  for (const r of rooms) broadcastPeers(r);
}, 30_000);

httpServer.listen(PORT, () => {
  console.log(`peer-beam signaling on :${PORT}`);
});
