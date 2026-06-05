"use client";

import type { DeviceId } from "@/types";

const STORAGE_KEY = "pairflux-trusted-peers";
const LEGACY_STORAGE_KEY = "peer-beam-trusted-peers";

export interface TrustedPeer {
  peerId: DeviceId;
  sessionId: string;
  peerName?: string;
  timestamp: number;
}

function readAll(): TrustedPeer[] {
  if (typeof window === "undefined") return [];
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) localStorage.setItem(STORAGE_KEY, raw);
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrustedPeer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(peers: TrustedPeer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(peers));
}

export function getTrustedPeers(): TrustedPeer[] {
  return readAll();
}

export function isTrustedPeer(peerId: DeviceId): boolean {
  return readAll().some((p) => p.peerId === peerId);
}

export function addTrustedPeer(entry: TrustedPeer): void {
  const peers = readAll().filter((p) => p.peerId !== entry.peerId);
  peers.push(entry);
  writeAll(peers);
}

export function removeTrustedPeer(peerId: DeviceId): void {
  writeAll(readAll().filter((p) => p.peerId !== peerId));
}

export function getTrustedPeerIds(): DeviceId[] {
  return readAll().map((p) => p.peerId);
}
