import { ADJECTIVES, ANIMALS, AVATAR_COLORS } from "@/lib/constants";
import type { DeviceId } from "@/types";

const DEVICE_KEY = "peer-beam-device-id";
const NAME_KEY = "peer-beam-device-name";

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDeviceName(): string {
  return `${randomItem(ADJECTIVES)} ${randomItem(ANIMALS)}`;
}

export function getAvatarColor(id: DeviceId): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getOrCreateDeviceId(): DeviceId {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getOrCreateDeviceName(): string {
  if (typeof window === "undefined") return "Peer";
  let name = localStorage.getItem(NAME_KEY);
  if (!name) {
    name = generateDeviceName();
    localStorage.setItem(NAME_KEY, name);
  }
  return name;
}

export function setDeviceName(name: string): void {
  localStorage.setItem(NAME_KEY, name.trim().slice(0, 32) || generateDeviceName());
}

export function getRoomId(): string {
  if (typeof window === "undefined") return "public";
  const params = new URLSearchParams(window.location.search);
  const room = params.get("room");
  if (room && /^[a-zA-Z0-9_-]{2,64}$/.test(room)) return room;
  return "public";
}
