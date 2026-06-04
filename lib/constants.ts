export const CHUNK_SIZE = 32 * 1024;
export const MAX_PENDING_CHUNKS = 4;
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

export function getSignalingUrl(): string {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_SIGNALING_URL ??
      `${window.location.protocol}//${window.location.hostname}:3001`
    );
  }
  return process.env.NEXT_PUBLIC_SIGNALING_URL ?? "http://localhost:3001";
}
