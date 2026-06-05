export const CHUNK_SIZE = 32 * 1024;
/** Stop sending while SCTP send buffer exceeds this (bytes). */
export const BUFFERED_AMOUNT_HIGH = 8 * 1024 * 1024;
/** Resume sending after drain event drops below this (bytes). */
export const BUFFERED_AMOUNT_LOW = 1 * 1024 * 1024;
/** Max wait before sending chat/text (avoid blocking behind large file buffers). */
export const CHAT_BUFFER_DRAIN_TIMEOUT_MS = 5_000;
export const CHUNK_ACK_TIMEOUT_MS = 30_000;
export const MAX_CHUNK_RETRIES = 8;
export const RECONNECT_DELAY_MS = 2000;
export const INACTIVE_TIMEOUT_MS = 5 * 60 * 1000;
export const SIGNALING_PATH = "/socket.io";

export const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-orange-500",
] as const;

export const ADJECTIVES = [
  "Swift",
  "Bright",
  "Calm",
  "Bold",
  "Neon",
  "Silent",
  "Rapid",
  "Cosmic",
] as const;

export const ANIMALS = [
  "Falcon",
  "Otter",
  "Panda",
  "Fox",
  "Hawk",
  "Lynx",
  "Wolf",
  "Dolphin",
] as const;

export function getStunServers(): RTCIceServer[] {
  const raw =
    process.env.NEXT_PUBLIC_STUN_SERVERS ??
    "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302";
  const urls = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const servers: RTCIceServer[] = urls.map((url) => ({ urls: url }));

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnPass = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
  if (turnUrl && turnUser && turnPass) {
    servers.push({
      urls: turnUrl,
      username: turnUser,
      credential: turnPass,
    });
  }
  return servers;
}

/** Resolved at build time in the browser bundle (NEXT_PUBLIC_*). */
function signalingUrlFromEnv(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_SIGNALING_URL ??
    process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

export function isLocalDevHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local")
  );
}

/**
 * Socket.io server origin (no path). Must be set in production via
 * NEXT_PUBLIC_SIGNALING_URL when the frontend is hosted separately (e.g. Vercel).
 */
export function getSignalingUrl(): string {
  const fromEnv = signalingUrlFromEnv();
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const { hostname, protocol, origin } = window.location;
    if (isLocalDevHost(hostname)) {
      return `${protocol}//${hostname}:3001`;
    }
    // Same-host reverse proxy (nginx /socket.io → signaling). Not available on Vercel alone.
    return origin;
  }

  return "http://localhost:3001";
}

export function isSignalingUrlConfigured(): boolean {
  if (signalingUrlFromEnv()) return true;
  if (typeof window === "undefined") return false;
  return isLocalDevHost(window.location.hostname);
}
