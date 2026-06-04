import { randomUUID } from "crypto";

export const PAIRING_CODE_TTL_MS = Number(process.env.PAIRING_CODE_TTL_MS ?? 3 * 60 * 1000);

export interface PendingPairing {
  code: string;
  fromId: string;
  fromSocketId: string;
  room: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export type PairingVerifyResult =
  | {
      ok: true;
      sessionId: string;
      hostId: string;
      hostSocketId: string;
      receiverId: string;
    }
  | { ok: false; reason: string };

function isValidCode(code: string): boolean {
  return /^\d{3}$/.test(code) && Number(code) >= 100 && Number(code) <= 999;
}

export class PairingStore {
  /** room -> code -> pending */
  private byRoom = new Map<string, Map<string, PendingPairing>>();

  register(
    room: string,
    fromId: string,
    fromSocketId: string,
    code: string
  ): { ok: true } | { ok: false; reason: string } {
    if (!isValidCode(code)) {
      return { ok: false, reason: "Code must be 3 digits (100–999)" };
    }

    this.purgeExpired(room);

    const roomMap = this.byRoom.get(room) ?? new Map();
    if (roomMap.has(code)) {
      return { ok: false, reason: "Code already in use — generate a new one" };
    }

    const now = Date.now();
    roomMap.set(code, {
      code,
      fromId,
      fromSocketId,
      room,
      sessionId: randomUUID(),
      createdAt: now,
      expiresAt: now + PAIRING_CODE_TTL_MS,
      used: false,
    });
    this.byRoom.set(room, roomMap);
    return { ok: true };
  }

  verify(
    room: string,
    code: string,
    receiverId: string
  ): PairingVerifyResult {
    if (!isValidCode(code)) {
      return { ok: false, reason: "Invalid code format" };
    }

    this.purgeExpired(room);

    const entry = this.byRoom.get(room)?.get(code);
    if (!entry) {
      return { ok: false, reason: "Code not found or expired" };
    }
    if (entry.used) {
      return { ok: false, reason: "Code already used" };
    }
    if (Date.now() > entry.expiresAt) {
      this.remove(room, code);
      return { ok: false, reason: "Code expired" };
    }
    if (entry.fromId === receiverId) {
      return { ok: false, reason: "Cannot pair with yourself" };
    }

    entry.used = true;
    return {
      ok: true,
      sessionId: entry.sessionId,
      hostId: entry.fromId,
      hostSocketId: entry.fromSocketId,
      receiverId,
    };
  }

  cancel(room: string, fromId: string, code: string): boolean {
    const roomMap = this.byRoom.get(room);
    const entry = roomMap?.get(code);
    if (!entry || entry.fromId !== fromId) return false;
    this.remove(room, code);
    return true;
  }

  purgeExpired(room?: string): void {
    const now = Date.now();
    const rooms = room ? [room] : [...this.byRoom.keys()];
    for (const r of rooms) {
      const roomMap = this.byRoom.get(r);
      if (!roomMap) continue;
      for (const [code, entry] of roomMap) {
        if (entry.used || now > entry.expiresAt) {
          roomMap.delete(code);
        }
      }
      if (roomMap.size === 0) this.byRoom.delete(r);
    }
  }

  private remove(room: string, code: string): void {
    this.byRoom.get(room)?.delete(code);
  }
}
