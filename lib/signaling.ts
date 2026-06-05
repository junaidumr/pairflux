"use client";

import { io, Socket } from "socket.io-client";
import {
  getSignalingUrl,
  isSignalingUrlConfigured,
  SIGNALING_PATH,
} from "@/lib/constants";
import type {
  PairingFailedPayload,
  PairingSuccessPayload,
  PeerDevice,
  SignalPayload,
} from "@/types";

export type SignalingEvents = {
  peers: (peers: PeerDevice[]) => void;
  "peer-joined": (peer: PeerDevice) => void;
  "peer-left": (payload: { id: string }) => void;
  signal: (payload: SignalPayload) => void;
  joined: (payload: { id: string; room: string; peers: PeerDevice[] }) => void;
  error: (payload: { message: string }) => void;
  connect: () => void;
  disconnect: () => void;
  "connect-error": (payload: { message: string }) => void;
  "pairing-code-ack": (payload: { type: "pairing-code-ack"; code: string; from: string }) => void;
  "pairing-success": (payload: PairingSuccessPayload) => void;
  "pairing-failed": (payload: PairingFailedPayload) => void;
};

export class SignalingClient {
  private socket: Socket | null = null;
  private listeners = new Map<keyof SignalingEvents, Set<(...args: unknown[]) => void>>();

  connect(
    deviceId: string,
    name: string,
    avatar: string,
    room: string
  ): void {
    if (this.socket?.connected) return;

    const url = getSignalingUrl();
    if (!isSignalingUrlConfigured()) {
      console.error(
        "[signaling] NEXT_PUBLIC_SIGNALING_URL is not set. Deploy the signaling server " +
          "(server/index.ts) to Railway/Render/Fly.io and set the env var in Vercel. " +
          `Attempting fallback: ${url}`
      );
    } else {
      console.log("[signaling] Connecting to", url, "room:", room);
    }

    this.socket = io(url, {
      path: SIGNALING_PATH,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    const bind = <K extends keyof SignalingEvents>(event: K) => {
      this.socket?.on(event as string, (...args: unknown[]) => {
        if (event === "joined") {
          const payload = args[0] as { room: string; peers: unknown[] };
          console.log("[signaling] Peer registered in room:", payload.room, "peers:", payload.peers.length);
        } else if (event === "peer-joined") {
          console.log("[signaling] Peer discovered:", args[0]);
        } else if (event === "peer-left") {
          console.log("[signaling] Peer left:", args[0]);
        } else if (event === "pairing-success") {
          console.log("[signaling] Pairing success:", args[0]);
        }
        this.emit(event, ...(args as Parameters<SignalingEvents[K]>));
      });
    };

    bind("peers");
    bind("peer-joined");
    bind("peer-left");
    bind("signal");
    bind("joined");
    bind("error");
    bind("connect");
    bind("disconnect");
    bind("pairing-code-ack");
    bind("pairing-success");
    bind("pairing-failed");

    this.socket.on("connect", () => {
      console.log("[signaling] Socket connected:", this.socket?.id);
      this.socket?.emit("join", { id: deviceId, name, avatar, room });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[signaling] Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("[signaling] Connection error:", err.message, "url:", url);
      this.emit("connect-error", { message: err.message });
    });
  }

  on<K extends keyof SignalingEvents>(event: K, handler: SignalingEvents[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as (...args: unknown[]) => void);
    return () => this.listeners.get(event)?.delete(handler as (...args: unknown[]) => void);
  }

  private emit<K extends keyof SignalingEvents>(
    event: K,
    ...args: Parameters<SignalingEvents[K]>
  ): void {
    this.listeners.get(event)?.forEach((h) => h(...args));
  }

  sendSignal(payload: SignalPayload): void {
    this.socket?.emit("signal", payload);
  }

  emitPairingCode(code: string, from: string): void {
    console.log("[signaling] Pairing request sent:", { code, from });
    this.socket?.emit("pairing-code", { type: "pairing-code", code, from });
  }

  emitPairingVerify(code: string, deviceId: string): void {
    console.log("[signaling] Pairing verify sent:", { code, deviceId });
    this.socket?.emit("pairing-verify", { type: "pairing-verify", code, deviceId });
  }

  emitPairingCancel(code: string, from: string): void {
    this.socket?.emit("pairing-cancel", { code, from });
  }

  heartbeat(): void {
    this.socket?.emit("heartbeat");
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}
