"use client";

import {
  configureChannelBufferThresholds,
  getBufferedAmount,
  waitForBufferDrain,
} from "@/lib/channel-backpressure";
import {
  CHAT_BUFFER_DRAIN_TIMEOUT_MS,
  getStunServers,
  RECONNECT_DELAY_MS,
} from "@/lib/constants";
import { tlog } from "@/lib/transfer-debug";
import { encodeControl, encodeWireChat, parseMessage } from "@/lib/protocol";
import type { ControlMessage, DeviceId, SignalPayload, WireChatMessage } from "@/types";

export type DataChannelHandler = (peerId: DeviceId, data: ArrayBuffer | string) => void;
export type ConnectionHandler = (peerId: DeviceId, connected: boolean) => void;
export type ConnectionStateHandler = (
  peerId: DeviceId,
  state: RTCPeerConnectionState
) => void;

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
  private onConnectionState: ConnectionStateHandler | null;

  constructor(
    localId: DeviceId,
    onSignal: (payload: SignalPayload) => void,
    onData: DataChannelHandler,
    onConnection: ConnectionHandler,
    onConnectionState?: ConnectionStateHandler
  ) {
    this.localId = localId;
    this.onSignal = onSignal;
    this.onData = onData;
    this.onConnection = onConnection;
    this.onConnectionState = onConnectionState ?? null;
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
      const cs = pc.connectionState;
      tlog("connection state", peerId, cs);
      this.onConnectionState?.(peerId, cs);

      const connected = cs === "connected" && state.channel?.readyState === "open";
      if (cs === "failed" || cs === "disconnected") {
        this.onConnection(peerId, false);
        this.scheduleReconnect(peerId);
      } else if (cs === "connected") {
        this.onConnection(peerId, connected);
      }
    };

    pc.oniceconnectionstatechange = () => {
      tlog("ice connection state", peerId, pc.iceConnectionState);
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
    configureChannelBufferThresholds(channel);

    channel.onopen = () => {
      tlog("datachannel open", peerId);
      this.onConnection(peerId, true);
    };

    channel.onclose = () => {
      tlog("datachannel closed", peerId);
      this.onConnection(peerId, false);
    };

    channel.onerror = (ev) => {
      tlog("datachannel error", peerId, ev);
      this.onConnection(peerId, false);
    };

    channel.onbufferedamountlow = () => {
      tlog("bufferedamountlow event", peerId, channel.bufferedAmount);
    };

    channel.onmessage = (ev) => {
      this.dispatchChannelMessage(peerId, ev.data as ArrayBuffer | string);
    };
  }

  /** Routes inbound data by protocol kind (chat vs transfer control vs file chunk). */
  private dispatchChannelMessage(peerId: DeviceId, raw: ArrayBuffer | string): void {
    this.onData(peerId, raw);
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
      const channel = state.pc.createDataChannel("pairflux", {
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
        const channel = state.pc.createDataChannel("pairflux", {
          ordered: true,
          maxRetransmits: 30,
        });
        state.channel = channel;
        this.wireChannel(from, channel);
      }
    }

    if (type === "offer" && sdp) {
      const offerCollision =
        state.makingOffer || state.pc.signalingState !== "stable";
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

  private getChannel(peerId: DeviceId): RTCDataChannel | null {
    const state = this.connections.get(peerId);
    if (!state?.channel || state.channel.readyState !== "open") return null;
    return state.channel;
  }

  async sendControl(peerId: DeviceId, msg: ControlMessage): Promise<boolean> {
    const channel = this.getChannel(peerId);
    if (!channel || channel.readyState !== "open") return false;
    const drained = await waitForBufferDrain(channel);
    if (!drained) return false;
    try {
      channel.send(encodeControl(msg));
      return true;
    } catch {
      return false;
    }
  }

  /** Text/link chat — short buffer wait so messages are not stuck behind file sends. */
  async sendChat(peerId: DeviceId, msg: WireChatMessage): Promise<boolean> {
    const channel = this.getChannel(peerId);
    if (!channel || channel.readyState !== "open") {
      tlog("sendChat skipped: channel not open", peerId, channel?.readyState);
      return false;
    }
    const drained = await waitForBufferDrain(channel, CHAT_BUFFER_DRAIN_TIMEOUT_MS);
    if (!drained) {
      tlog("sendChat blocked: buffer drain timeout", peerId, channel.bufferedAmount);
      return false;
    }
    try {
      channel.send(encodeWireChat(msg));
      return true;
    } catch (err) {
      tlog("sendChat error", peerId, err);
      return false;
    }
  }

  async sendRaw(peerId: DeviceId, data: ArrayBuffer): Promise<boolean> {
    const channel = this.getChannel(peerId);
    if (!channel) return false;

    const drained = await waitForBufferDrain(channel);
    if (!drained) {
      tlog("sendRaw blocked: buffer drain timeout", peerId, channel.bufferedAmount);
      return false;
    }

    try {
      channel.send(data);
      tlog("chunk sent on wire", peerId, "bufferedAmount", channel.bufferedAmount);
      return true;
    } catch (err) {
      tlog("sendRaw error", peerId, err);
      return false;
    }
  }

  getBufferedAmount(peerId: DeviceId): number {
    const channel = this.getChannel(peerId);
    return channel ? getBufferedAmount(channel) : 0;
  }

  /** @deprecated sync send — use sendRaw */
  sendControlSync(peerId: DeviceId, msg: ControlMessage): boolean {
    void this.sendControl(peerId, msg);
    return true;
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

  handleIncomingData(
    peerId: DeviceId,
    raw: ArrayBuffer | string
  ): ReturnType<typeof parseMessage> {
    return parseMessage(raw);
  }

  disconnectAll(): void {
    for (const id of [...this.connections.keys()]) {
      this.disconnectPeer(id);
    }
  }
}
