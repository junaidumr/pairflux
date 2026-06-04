"use client";

import { io, Socket } from "socket.io-client";
import { getSignalingUrl, SIGNALING_PATH } from "@/lib/constants";
import type { PeerDevice, SignalPayload } from "@/types";

export type SignalingEvents = {
  peers: (peers: PeerDevice[]) => void;
  "peer-joined": (peer: PeerDevice) => void;
  "peer-left": (payload: { id: string }) => void;
  signal: (payload: SignalPayload) => void;
  joined: (payload: { id: string; room: string; peers: PeerDevice[] }) => void;
  error: (payload: { message: string }) => void;
  connect: () => void;
  disconnect: () => void;
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

    this.socket = io(getSignalingUrl(), {
      path: SIGNALING_PATH,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    const bind = <K extends keyof SignalingEvents>(event: K) => {
      this.socket?.on(event as string, (...args: unknown[]) => {
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

    this.socket.on("connect", () => {
      this.socket?.emit("join", { id: deviceId, name, avatar, room });
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
