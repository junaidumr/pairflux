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
| `NEXT_PUBLIC_SIGNALING_URL` | Socket.io server URL |
| `NEXT_PUBLIC_STUN_SERVERS` | Comma-separated STUN URLs |
| `NEXT_PUBLIC_TURN_*` | Optional TURN credentials |
| `PORT` | Signaling server port (default 3001) |
| `CORS_ORIGIN` | Allowed frontend origin(s) |

## Production

### Build

```bash
npm run build
npm run start
```

### Docker

```bash
docker compose up --build
```

With Nginx reverse proxy:

```bash
docker compose --profile production up --build
```

Set `NEXT_PUBLIC_SIGNALING_URL` to your public signaling URL (e.g. `https://your-domain.com` if proxied under `/socket.io/`).

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
