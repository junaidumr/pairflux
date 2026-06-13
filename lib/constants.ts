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
/** Signaling server port in local dev (avoid 3001 — Next.js uses that as fallback). */
export const DEV_SIGNALING_PORT =
  process.env.NEXT_PUBLIC_SIGNALING_PORT ?? "3002";

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

import {
  isDevNetworkHost,
  isLocalDevHost,
} from "@/lib/network-hosts";

export { isLocalDevHost } from "@/lib/network-hosts";

/** Resolved at build time in the browser bundle (NEXT_PUBLIC_*). */
function signalingUrlFromEnv(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_SIGNALING_URL ??
    process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

/**
 * When env points at localhost but the page is opened via LAN IP (e.g. phone
 * at 192.168.x.x:3000), rewrite the signaling host to match the page host.
 * Also migrates legacy dev configs that used port 3001 (conflicts with Next.js).
 */
function normalizeDevSignalingUrl(
  envUrl: string,
  pageHostname: string,
  pageProtocol: string
): string {
  try {
    const parsed = new URL(envUrl);
    if (isLocalDevHost(parsed.hostname) && (!parsed.port || parsed.port === "3001")) {
      parsed.port = DEV_SIGNALING_PORT;
    }
    if (
      isLocalDevHost(parsed.hostname) &&
      isDevNetworkHost(pageHostname) &&
      parsed.hostname !== pageHostname
    ) {
      return `${pageProtocol}//${pageHostname}:${parsed.port || DEV_SIGNALING_PORT}`;
    }
    return parsed.origin;
  } catch {
    return envUrl;
  }
}

/**
 * Socket.io server origin (no path). Must be set in production via
 * NEXT_PUBLIC_SIGNALING_URL when the frontend is hosted separately (e.g. Vercel).
 */
export function getSignalingUrl(): string {
  const fromEnv = signalingUrlFromEnv();

  if (typeof window !== "undefined") {
    const { hostname, protocol, origin } = window.location;

    if (fromEnv) {
      return normalizeDevSignalingUrl(fromEnv, hostname, protocol);
    }
    if (isDevNetworkHost(hostname)) {
      return `${protocol}//${hostname}:${DEV_SIGNALING_PORT}`;
    }
    return origin;
  }

  if (fromEnv) return fromEnv;
  return `http://localhost:${DEV_SIGNALING_PORT}`;
}

export function isSignalingUrlConfigured(): boolean {
  if (signalingUrlFromEnv()) return true;
  if (typeof window === "undefined") return false;
  return isDevNetworkHost(window.location.hostname);
}
