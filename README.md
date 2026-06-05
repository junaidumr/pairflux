# Pairflux

Production-ready, browser-to-browser file sharing inspired by PairDrop and Snapdrop. No accounts, no database, no file storage on the server — only WebRTC data channels for transfers and Socket.io for signaling.

## Features

- Real-time peer discovery (Socket.io)
- WebRTC P2P connections with STUN/TURN support
- Chunked file transfer (32KB) with ACK, backpressure, cancel/retry
- Drag & drop, multi-file, and folder sharing
- Text, link, and clipboard sharing
- QR code pair / scan
- Dark & light themes (shadcn/ui)
- Rate-limited signaling server

## Quick start

### Prerequisites

- Node.js 20+
- Two browsers (or devices) on the same network for local testing

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Run (frontend + signaling)

```bash
npm run dev
```

If you see `Cannot find module './331.js'` or similar webpack errors, clear the build cache and restart:

```bash
npm run clean
npm run dev
```

- Web app: [http://localhost:3000](http://localhost:3000)
- Signaling: [http://localhost:3001](http://localhost:3001)

### 3. Share files

1. Open [http://localhost:3000](http://localhost:3000) and click **Start Sharing**.
2. Open the same URL on another device (same room — default `public`, or use `?room=myroom`).
3. Select a peer (optional) and drop files, or send to all connected peers.
4. Accept incoming transfers in the dialog.

### Custom room

```
http://localhost:3000/share?room=office-42
```

### QR pairing

Use **QR Pair** in the app header to show or scan a code that encodes room + device.

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SIGNALING_URL` | Socket.io server URL (required on Vercel) |
| `NEXT_PUBLIC_SOCKET_URL` | Alias for `NEXT_PUBLIC_SIGNALING_URL` |
| `NEXT_PUBLIC_STUN_SERVERS` | Comma-separated STUN URLs |
| `NEXT_PUBLIC_TURN_*` | Optional TURN credentials |
| `PORT` | Signaling server port (default 3001) |
| `CORS_ORIGIN` | Allowed frontend origin(s) |

## Production

PeerBeam needs **two deployments**:

| Component | Where | Why |
|-----------|-------|-----|
| Next.js frontend | **Vercel** | Static/SSR app |
| Socket.io signaling (`server/index.ts`) | **Railway, Render, Fly.io, or VPS** | Long-lived WebSocket server |

**Socket.io cannot run on Vercel.** Vercel Functions are stateless, short-lived, and do not support persistent WebSocket rooms. Without a separate signaling server, production clients cannot discover peers or exchange WebRTC offers.

### 1. Deploy signaling server

**Render** (easiest):

1. Push this repo to GitHub.
2. Render → New → Blueprint → connect repo (`render.yaml` is included).
3. Set `CORS_ORIGIN` to `https://peer-beam-eta.vercel.app,http://localhost:3000`.
4. Copy the public URL (e.g. `https://pairflux-signaling.onrender.com`).

**Railway / Docker / VPS:**

```bash
# Docker (signaling only)
docker build -f Dockerfile.signaling -t pairflux-signaling .
docker run -p 3001:3001 \
  -e CORS_ORIGIN=https://peer-beam-eta.vercel.app,http://localhost:3000 \
  pairflux-signaling

# Or directly
PORT=3001 CORS_ORIGIN=https://peer-beam-eta.vercel.app npm run start:signal
```

Verify: `curl https://YOUR-SIGNALING-URL/health` → `{"ok":true,"service":"pairflux-signaling"}`

### 2. Configure Vercel (frontend)

In Vercel → Project → Settings → Environment Variables:

| Variable | Production value |
|----------|------------------|
| `NEXT_PUBLIC_SIGNALING_URL` | `https://YOUR-SIGNALING-URL` (no trailing slash) |

Redeploy after saving. Open DevTools → Console on `/share` — you should see `[signaling] Socket connected: <id>`.

### 3. All-in-one Docker (self-hosted)

```bash
docker compose up --build
```

With Nginx reverse proxy (frontend + signaling on one domain):

```bash
docker compose --profile production up --build
```

Set `NEXT_PUBLIC_SIGNALING_URL` to your public origin if proxied under `/socket.io/`.

### Troubleshooting production

- Header shows **Offline** → signaling URL wrong or server not running.
- Console: `Connection error` → check `CORS_ORIGIN` includes your exact Vercel URL (scheme + host).
- Peers not visible → both devices must use the same `?room=` (default `public`).
- WebRTC fails after pairing → add a TURN server (`NEXT_PUBLIC_TURN_*`) for strict NAT/firewalls.

## Architecture

```
Browser A ←—— WebRTC DataChannel (files) ——→ Browser B
     │                                           │
     └──────── Socket.io (signaling only) ───────┘
                         │
                  Express server
```

- **Signaling**: peer list, offers, answers, ICE candidates
- **Transfer**: chunked binary over `RTCDataChannel` with JSON control messages

## Project structure

```
app/           Next.js routes (landing + /share)
components/    UI (shadcn) + share panels
hooks/         usePairflux orchestration
lib/           WebRTC, transfer engine, protocol
server/        Express + Socket.io signaling
types/         Shared TypeScript types
```

## License

MIT
