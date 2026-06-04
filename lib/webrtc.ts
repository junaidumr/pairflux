"use client";

import { getStunServers, RECONNECT_DELAY_MS } from "@/lib/constants";
import { encodeControl, parseMessage } from "@/lib/protocol";
import type { ControlMessage, DeviceId, SignalPayload } from "@/types";

export type DataChannelHandler = (peerId: DeviceId, data: ArrayBuffer | string) => void;
export type ConnectionHandler = (peerId: DeviceId, connected: boolean) => void;

interface PeerConnectionState {
  pc: RTCPeerConnection;
  channel: RTCDataChannel | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  makingOffer: boolean;
  ignoreOffer: boolean;
  polite: boolean;
}

export class WebRTCManager {
  private connections = new Map<DeviceId, PeerConnectionState>();
  private localId: DeviceId;
  private onSignal: (payload: SignalPayload) => void;
  private onData: DataChannelHandler;
  private onConnection: ConnectionHandler;

  constructor(
    localId: DeviceId,
    onSignal: (payload: SignalPayload) => void,
    onData: DataChannelHandler,
    onConnection: ConnectionHandler
  ) {
    this.localId = localId;
    this.onSignal = onSignal;
    this.onData = onData;
    this.onConnection = onConnection;
  }

  private createPeerConnection(peerId: DeviceId, polite: boolean): PeerConnectionState {
    const pc = new RTCPeerConnection({ iceServers: getStunServers() });
    const state: PeerConnectionState = {
      pc,
      channel: null,
      reconnectTimer: null,
      makingOffer: false,
      ignoreOffer: false,
      polite,
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        this.onSignal({
          type: "ice",
          from: this.localId,
          to: peerId,
          candidate: ev.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const connected =
        pc.connectionState === "connected" && state.channel?.readyState === "open";
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        this.scheduleReconnect(peerId);
      }
      this.onConnection(peerId, connected);
    };

    pc.ondatachannel = (ev) => {
      state.channel = ev.channel;
      this.wireChannel(peerId, ev.channel);
    };

    this.connections.set(peerId, state);
    return state;
  }

  private wireChannel(peerId: DeviceId, channel: RTCDataChannel): void {
    channel.binaryType = "arraybuffer";
    channel.onopen = () => this.onConnection(peerId, true);
    channel.onclose = () => this.onConnection(peerId, false);
    channel.onmessage = (ev) => {
      const data = ev.data as ArrayBuffer | string;
      this.onData(peerId, data);
    };
  }

  async connectToPeer(peerId: DeviceId, polite = false): Promise<void> {
    if (this.connections.has(peerId)) {
      const existing = this.connections.get(peerId)!;
      if (
        existing.pc.connectionState === "connected" &&
        existing.channel?.readyState === "open"
      ) {
        return;
      }
    }

    const state = this.createPeerConnection(peerId, polite);
    if (!state.channel) {
      const channel = state.pc.createDataChannel("peer-beam", {
        ordered: true,
        maxRetransmits: 30,
      });
      state.channel = channel;
      this.wireChannel(peerId, channel);
    }

    if (!polite) {
      await this.makeOffer(peerId);
    }
  }

  private async makeOffer(peerId: DeviceId): Promise<void> {
    const state = this.connections.get(peerId);
    if (!state) return;
    try {
      state.makingOffer = true;
      await state.pc.setLocalDescription(await state.pc.createOffer());
      this.onSignal({
        type: "offer",
        from: this.localId,
        to: peerId,
        sdp: state.pc.localDescription ?? undefined,
      });
    } finally {
      state.makingOffer = false;
    }
  }

  async handleSignal(payload: SignalPayload): Promise<void> {
    const { type, from, to, sdp, candidate } = payload;
    if (to !== this.localId) return;

    let state = this.connections.get(from);
    const polite = this.localId > from;

    if (!state) {
      state = this.createPeerConnection(from, polite);
      if (!polite) {
        const channel = state.pc.createDataChannel("peer-beam", {
          ordered: true,
          maxRetransmits: 30,
        });
        state.channel = channel;
        this.wireChannel(from, channel);
      }
    }

    if (type === "offer" && sdp) {
      const offerCollision =
        state.makingOffer ||
        state.pc.signalingState !== "stable";
      state.ignoreOffer = !polite && offerCollision;
      if (state.ignoreOffer) return;

      await state.pc.setRemoteDescription(sdp);
      await state.pc.setLocalDescription(await state.pc.createAnswer());
      this.onSignal({
        type: "answer",
        from: this.localId,
        to: from,
        sdp: state.pc.localDescription ?? undefined,
      });
    } else if (type === "answer" && sdp) {
      if (state.pc.signalingState === "have-local-offer") {
        await state.pc.setRemoteDescription(sdp);
      }
    } else if (type === "ice" && candidate) {
      try {
        await state.pc.addIceCandidate(candidate);
      } catch {
        /* ignore stale candidates */
      }
    }
  }

  sendControl(peerId: DeviceId, msg: ControlMessage): boolean {
    const state = this.connections.get(peerId);
    if (!state?.channel || state.channel.readyState !== "open") return false;
    state.channel.send(encodeControl(msg));
    return true;
  }

  sendRaw(peerId: DeviceId, data: ArrayBuffer): boolean {
    const state = this.connections.get(peerId);
    if (!state?.channel || state.channel.readyState !== "open") return false;
    // Backpressure: caller retries when buffer is full
    if (state.channel.bufferedAmount > 8 * 1024 * 1024) return false;
    try {
      state.channel.send(data);
      return true;
    } catch {
      return false;
    }
  }

  isConnected(peerId: DeviceId): boolean {
    const state = this.connections.get(peerId);
    return (
      state?.pc.connectionState === "connected" &&
      state.channel?.readyState === "open"
    ) ?? false;
  }

  disconnectPeer(peerId: DeviceId): void {
    const state = this.connections.get(peerId);
    if (!state) return;
    if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
    state.channel?.close();
    state.pc.close();
    this.connections.delete(peerId);
    this.onConnection(peerId, false);
  }

  private scheduleReconnect(peerId: DeviceId): void {
    const state = this.connections.get(peerId);
    if (!state || state.reconnectTimer) return;
    state.reconnectTimer = setTimeout(async () => {
      state.reconnectTimer = null;
      this.disconnectPeer(peerId);
      await this.connectToPeer(peerId, this.localId > peerId);
    }, RECONNECT_DELAY_MS);
  }

  handleIncomingData(peerId: DeviceId, raw: ArrayBuffer | string): ReturnType<typeof parseMessage> {
    return parseMessage(raw);
  }

  disconnectAll(): void {
    for (const id of [...this.connections.keys()]) {
      this.disconnectPeer(id);
    }
  }
}
