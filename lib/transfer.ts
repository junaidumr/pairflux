"use client";

import {
  CHUNK_ACK_TIMEOUT_MS,
  CHUNK_SIZE,
  MAX_CHUNK_RETRIES,
} from "@/lib/constants";
import {
  createReceiveSink,
  type ReceiveSinkHandle,
} from "@/lib/file-receiver";
import { encodeChunk } from "@/lib/protocol";
import { tlog } from "@/lib/transfer-debug";
import type { ControlMessage, DeviceId, TransferItem, TransferStatus } from "@/types";

type TransferUpdate = (item: TransferItem) => void;
type SendRawFn = (peerId: DeviceId, data: ArrayBuffer) => Promise<boolean>;
type SendControlFn = (peerId: DeviceId, msg: ControlMessage) => Promise<boolean>;
type IsConnectedFn = (peerId: DeviceId) => boolean;

export type IncomingCompletePayload = {
  id: string;
  peerId: DeviceId;
  peerName: string;
  name: string;
  size: number;
  mime: string;
  blob: Blob | null;
  startedAt: number;
};

type IncomingCompleteFn = (payload: IncomingCompletePayload) => void;

interface OutgoingState {
  file: File;
  peerId: DeviceId;
  peerName: string;
  id: string;
  lastAcked: number;
  awaitingAck: boolean;
  inflightIndex: number | null;
  bytesSent: number;
  startedAt: number;
  lastSpeedAt: number;
  lastSpeedBytes: number;
  aborted: boolean;
  status: TransferStatus;
  retries: number;
  ackTimer: ReturnType<typeof setTimeout> | null;
  loopRunning: boolean;
  error?: string;
}

interface IncomingState {
  id: string;
  peerId: DeviceId;
  peerName: string;
  name: string;
  size: number;
  mime: string;
  nextExpected: number;
  totalReceived: number;
  status: TransferStatus;
  startedAt: number;
  completing: boolean;
  sink: ReceiveSinkHandle | null;
}

function chunkByteLength(fileSize: number, index: number): number {
  const start = index * CHUNK_SIZE;
  if (start >= fileSize) return 0;
  return Math.min(CHUNK_SIZE, fileSize - start);
}

function totalChunkCount(fileSize: number): number {
  if (fileSize <= 0) return 1;
  return Math.ceil(fileSize / CHUNK_SIZE);
}

export class TransferEngine {
  private outgoing = new Map<string, OutgoingState>();
  private incoming = new Map<string, IncomingState>();
  private onUpdate: TransferUpdate;
  private onIncomingComplete: IncomingCompleteFn;
  private sendRaw: SendRawFn;
  private sendControl: SendControlFn;
  private isConnected: IsConnectedFn;
  private getBufferedAmount: (peerId: DeviceId) => number;

  constructor(
    onUpdate: TransferUpdate,
    sendRaw: SendRawFn,
    sendControl: SendControlFn,
    isConnected: IsConnectedFn,
    getBufferedAmount: (peerId: DeviceId) => number,
    onIncomingComplete: IncomingCompleteFn
  ) {
    this.onUpdate = onUpdate;
    this.onIncomingComplete = onIncomingComplete;
    this.sendRaw = sendRaw;
    this.sendControl = sendControl;
    this.isConnected = isConnected;
    this.getBufferedAmount = getBufferedAmount;
  }

  onPeerConnectionState(peerId: DeviceId, state: RTCPeerConnectionState): void {
    tlog("peer connection state for transfers", peerId, state);
    if (state === "connected") {
      for (const out of this.outgoing.values()) {
        if (out.peerId !== peerId || out.status !== "transferring") continue;
        if (out.aborted) continue;
        void this.sendControl(peerId, {
          type: "transfer-resume",
          id: out.id,
          fromChunk: out.lastAcked + 1,
        });
        void this.runSendLoop(out.id);
      }
      return;
    }
    if (state === "disconnected" || state === "failed" || state === "closed") {
      for (const out of this.outgoing.values()) {
        if (out.peerId !== peerId || out.status !== "transferring") continue;
        this.clearAckTimer(out);
        out.awaitingAck = false;
        tlog("transfer paused due to connection", out.id);
        this.emitOutgoing(out, "Connection interrupted — will resume when reconnected");
      }
    }
  }

  private clearAckTimer(out: OutgoingState): void {
    if (out.ackTimer) {
      clearTimeout(out.ackTimer);
      out.ackTimer = null;
    }
  }

  private async sendAck(peerId: DeviceId, transferId: string, index: number, attempt = 0): Promise<void> {
    const msg: ControlMessage = { type: "chunk-ack", id: transferId, index };
    const ok = await this.sendControl(peerId, msg);
    if (ok) {
      tlog("ack sent", transferId, index);
      return;
    }
    if (attempt < 30) {
      setTimeout(() => void this.sendAck(peerId, transferId, index, attempt + 1), 40);
    }
  }

  requestSend(file: File, peerId: DeviceId, peerName: string): string {
    const id = crypto.randomUUID();
    this.outgoing.set(id, {
      file,
      peerId,
      peerName,
      id,
      lastAcked: -1,
      awaitingAck: false,
      inflightIndex: null,
      bytesSent: 0,
      startedAt: Date.now(),
      lastSpeedAt: Date.now(),
      lastSpeedBytes: 0,
      aborted: false,
      status: "awaiting-accept",
      retries: 0,
      ackTimer: null,
      loopRunning: false,
    });
    this.onUpdate({
      id,
      peerId,
      peerName,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      direction: "outgoing",
      status: "awaiting-accept",
      progress: 0,
      speedBps: 0,
      etaSeconds: null,
    });
    void this.sendControl(peerId, {
      type: "transfer-request",
      id,
      name: file.name,
      size: file.size,
      mime: file.type || "application/octet-stream",
    });
    return id;
  }

  async handleControl(peerId: DeviceId, peerName: string, msg: ControlMessage): Promise<void> {
    switch (msg.type) {
      case "transfer-request": {
        this.incoming.set(msg.id, {
          id: msg.id,
          peerId,
          peerName,
          name: msg.name,
          size: msg.size,
          mime: msg.mime,
          nextExpected: 0,
          totalReceived: 0,
          status: "awaiting-accept",
          startedAt: Date.now(),
          completing: false,
          sink: null,
        });
        this.onUpdate({
          id: msg.id,
          peerId,
          peerName,
          fileName: msg.name,
          fileSize: msg.size,
          mimeType: msg.mime,
          direction: "incoming",
          status: "awaiting-accept",
          progress: 0,
          speedBps: 0,
          etaSeconds: null,
        });
        break;
      }
      case "transfer-accept":
        await this.startOutgoing(msg.id);
        break;
      case "transfer-reject":
        this.finishOutgoing(msg.id, "rejected");
        break;
      case "transfer-cancel":
        this.cancelTransfer(msg.id);
        break;
      case "transfer-resume":
        await this.resumeOutgoing(msg.id, msg.fromChunk);
        break;
      case "chunk-ack":
        this.handleAck(msg.id, msg.index);
        break;
      case "transfer-complete":
        this.finishOutgoing(msg.id, "completed");
        break;
      default:
        break;
    }
  }

  async acceptIncoming(id: string): Promise<void> {
    const inc = this.incoming.get(id);
    if (!inc) return;
    inc.sink = await createReceiveSink(inc.name, inc.size);
    inc.status = "transferring";
    inc.startedAt = Date.now();
    void this.sendControl(inc.peerId, { type: "transfer-accept", id });
    this.emitIncoming(inc);
  }

  rejectIncoming(id: string): void {
    const inc = this.incoming.get(id);
    if (!inc) return;
    void this.sendControl(inc.peerId, { type: "transfer-reject", id });
    if (inc.sink) void inc.sink.sink.abort();
    inc.status = "rejected";
    this.emitIncoming(inc);
    this.incoming.delete(id);
  }

  cancelTransfer(id: string): void {
    const out = this.outgoing.get(id);
    const inc = this.incoming.get(id);
    if (out) {
      out.aborted = true;
      this.clearAckTimer(out);
      void this.sendControl(out.peerId, { type: "transfer-cancel", id });
      this.finishOutgoing(id, "cancelled");
    }
    if (inc) {
      void this.sendControl(inc.peerId, { type: "transfer-cancel", id });
      if (inc.sink) void inc.sink.sink.abort();
      inc.status = "cancelled";
      this.emitIncoming(inc);
      this.incoming.delete(id);
    }
  }

  retryOutgoing(id: string): void {
    const out = this.outgoing.get(id);
    if (!out || out.status !== "failed") return;
    out.aborted = false;
    out.status = "awaiting-accept";
    out.awaitingAck = false;
    out.retries = 0;
    void this.sendControl(out.peerId, {
      type: "transfer-request",
      id: out.id,
      name: out.file.name,
      size: out.file.size,
      mime: out.file.type || "application/octet-stream",
    });
    this.emitOutgoing(out);
  }

  private async startOutgoing(id: string): Promise<void> {
    const out = this.outgoing.get(id);
    if (!out || out.aborted) return;
    out.status = "transferring";
    out.startedAt = Date.now();
    out.lastSpeedAt = Date.now();
    out.lastSpeedBytes = 0;
    out.retries = 0;
    this.emitOutgoing(out);
    await this.runSendLoop(id);
  }

  private async resumeOutgoing(id: string, fromChunk: number): Promise<void> {
    const out = this.outgoing.get(id);
    if (!out || out.aborted) return;
    out.status = "transferring";
    out.lastAcked = fromChunk - 1;
    out.awaitingAck = false;
    out.inflightIndex = null;
    out.retries = 0;
    this.clearAckTimer(out);
    tlog("resume transfer", id, "from chunk", fromChunk);
    await this.runSendLoop(id);
  }

  private async runSendLoop(id: string): Promise<void> {
    const out = this.outgoing.get(id);
    if (!out || out.loopRunning) return;
    out.loopRunning = true;

    try {
      while (
        out.status === "transferring" &&
        !out.aborted &&
        this.isConnected(out.peerId)
      ) {
        const total = totalChunkCount(out.file.size);
        if (out.lastAcked >= total - 1 && !out.awaitingAck) {
          await this.completeOutgoing(out);
          break;
        }

        if (out.awaitingAck) {
          break;
        }

        const index = out.lastAcked + 1;
        if (index >= total) break;

        await this.sendChunk(out, index);
        break;
      }
    } finally {
      out.loopRunning = false;
    }
  }

  private async sendChunk(out: OutgoingState, index: number): Promise<void> {
    const id = out.id;
    const start = index * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, out.file.size);
    const buffer = await out.file.slice(start, end).arrayBuffer();
    const packet = encodeChunk(id, index, buffer);

    const buffered = this.getBufferedAmount(out.peerId);
    tlog("chunk send attempt", id, index, "bufferedAmount", buffered);

    const sent = await this.sendRaw(out.peerId, packet);
    if (!sent) {
      out.status = "failed";
      out.error = "Data channel buffer full or closed";
      this.emitOutgoing(out, out.error);
      return;
    }

    tlog("chunk sent", id, index);
    out.awaitingAck = true;
    out.inflightIndex = index;
    this.updateOutgoingProgress(out);

    this.clearAckTimer(out);
    out.ackTimer = setTimeout(() => {
      void this.onAckTimeout(id, index);
    }, CHUNK_ACK_TIMEOUT_MS);
  }

  private async onAckTimeout(id: string, index: number): Promise<void> {
    const out = this.outgoing.get(id);
    if (!out || !out.awaitingAck || out.inflightIndex !== index) return;

    tlog("ack timeout", id, index, "retries", out.retries);

    if (out.retries >= MAX_CHUNK_RETRIES) {
      out.status = "failed";
      out.error = `No ACK for chunk ${index}`;
      out.awaitingAck = false;
      this.emitOutgoing(out, out.error);
      return;
    }

    out.retries++;
    out.awaitingAck = false;
    out.inflightIndex = null;
    await this.runSendLoop(id);
  }

  private handleAck(id: string, index: number): void {
    const out = this.outgoing.get(id);
    if (!out || out.status !== "transferring") return;

    tlog("ack received", id, index, "expected", out.lastAcked + 1);

    if (index < 0) return;
    if (index <= out.lastAcked) return;

    const expected = out.lastAcked + 1;
    if (index !== expected) {
      tlog("ack out of order ignored", id, index, "expected", expected);
      return;
    }

    if (!out.awaitingAck || out.inflightIndex !== index) {
      return;
    }

    this.clearAckTimer(out);
    out.lastAcked = index;
    out.bytesSent += chunkByteLength(out.file.size, index);
    out.awaitingAck = false;
    out.inflightIndex = null;
    out.retries = 0;

    this.updateOutgoingProgress(out);

    const total = totalChunkCount(out.file.size);
    if (index >= total - 1) {
      void this.completeOutgoing(out);
      return;
    }

    void this.runSendLoop(id);
  }

  private updateOutgoingProgress(out: OutgoingState): void {
    const now = Date.now();
    const dt = Math.max((now - out.lastSpeedAt) / 1000, 0.001);
    const delta = out.bytesSent - out.lastSpeedBytes;
    const speed = delta / dt;
    out.lastSpeedAt = now;
    out.lastSpeedBytes = out.bytesSent;
    const remaining = Math.max(0, out.file.size - out.bytesSent);
    const eta = speed > 0 ? remaining / speed : null;

    this.onUpdate({
      id: out.id,
      peerId: out.peerId,
      peerName: out.peerName,
      fileName: out.file.name,
      fileSize: out.file.size,
      mimeType: out.file.type,
      direction: "outgoing",
      status: out.status,
      progress:
        out.file.size > 0
          ? Math.min(100, (out.bytesSent / out.file.size) * 100)
          : 100,
      speedBps: speed,
      etaSeconds: eta,
      error: out.error,
    });
  }

  private async completeOutgoing(out: OutgoingState): Promise<void> {
    if (out.status === "completed") return;
    tlog("transfer complete (sender)", out.id);
    await this.sendControl(out.peerId, { type: "transfer-complete", id: out.id });
    this.finishOutgoing(out.id, "completed");
  }

  async handleChunk(
    peerId: DeviceId,
    peerName: string,
    transferId: string,
    index: number,
    data: ArrayBuffer
  ): Promise<void> {
    const inc = this.incoming.get(transferId);
    if (!inc || inc.status !== "transferring" || inc.completing) return;

    const total = totalChunkCount(inc.size);

    if (index < inc.nextExpected) {
      void this.sendAck(peerId, transferId, index);
      return;
    }

    if (index > inc.nextExpected) {
      tlog("chunk out of order buffered", transferId, index, "expected", inc.nextExpected);
      return;
    }

    tlog("chunk received", transferId, index, data.byteLength);

    if (!inc.sink) return;
    await inc.sink.sink.write(data);
    inc.totalReceived += data.byteLength;
    void this.sendAck(peerId, transferId, index);
    inc.nextExpected++;

    const progress =
      inc.size > 0 ? Math.min(100, (inc.totalReceived / inc.size) * 100) : 100;
    const elapsed = Math.max((Date.now() - inc.startedAt) / 1000, 0.001);
    const speed = inc.totalReceived / elapsed;
    const eta =
      speed > 0 ? Math.max(0, inc.size - inc.totalReceived) / speed : null;

    this.onUpdate({
      id: transferId,
      peerId,
      peerName,
      fileName: inc.name,
      fileSize: inc.size,
      mimeType: inc.mime,
      direction: "incoming",
      status: "transferring",
      progress,
      speedBps: speed,
      etaSeconds: eta,
    });

    if (inc.nextExpected >= total || inc.totalReceived >= inc.size) {
      await this.completeIncoming(inc);
    }
  }

  private async completeIncoming(inc: IncomingState): Promise<void> {
    if (inc.completing) return;
    inc.completing = true;

    const total = totalChunkCount(inc.size);
    if (inc.nextExpected < total) {
      inc.completing = false;
      tlog("complete deferred, missing chunks", inc.id, inc.nextExpected, total);
      return;
    }

    try {
      if (!inc.sink) {
        inc.completing = false;
        return;
      }
      if (inc.sink.mode === "disk") {
        await inc.sink.sink.finalize();
        this.onIncomingComplete({
          id: inc.id,
          peerId: inc.peerId,
          peerName: inc.peerName,
          name: inc.name,
          size: inc.size,
          mime: inc.mime,
          blob: null,
          startedAt: inc.startedAt,
        });
      } else {
        const parts = inc.sink.sink.getParts();
        const blob = new Blob(parts, { type: inc.mime });
        this.onIncomingComplete({
          id: inc.id,
          peerId: inc.peerId,
          peerName: inc.peerName,
          name: inc.name,
          size: inc.size,
          mime: inc.mime,
          blob,
          startedAt: inc.startedAt,
        });
      }

      inc.status = "completed";
      this.onUpdate({
        id: inc.id,
        peerId: inc.peerId,
        peerName: inc.peerName,
        fileName: inc.name,
        fileSize: inc.size,
        mimeType: inc.mime,
        direction: "incoming",
        status: "completed",
        progress: 100,
        speedBps: 0,
        etaSeconds: 0,
        completedAt: Date.now(),
      });
      await this.sendControl(inc.peerId, { type: "transfer-complete", id: inc.id });
      tlog("transfer complete (receiver)", inc.id);
    } catch (err) {
      tlog("complete incoming failed", inc.id, err);
      inc.status = "failed";
      this.emitIncoming(inc);
    } finally {
      this.incoming.delete(inc.id);
    }
  }

  private finishOutgoing(id: string, status: TransferStatus): void {
    const out = this.outgoing.get(id);
    if (!out) return;
    this.clearAckTimer(out);
    out.status = status;
    out.awaitingAck = false;
    this.onUpdate({
      id: out.id,
      peerId: out.peerId,
      peerName: out.peerName,
      fileName: out.file.name,
      fileSize: out.file.size,
      mimeType: out.file.type,
      direction: "outgoing",
      status,
      progress: status === "completed" ? 100 : Math.min(100, (out.bytesSent / out.file.size) * 100),
      speedBps: 0,
      etaSeconds: status === "completed" ? 0 : null,
      error: out.error,
      completedAt: status === "completed" || status === "failed" ? Date.now() : undefined,
    });
    if (status === "completed" || status === "cancelled" || status === "rejected") {
      this.outgoing.delete(id);
    }
  }

  private emitOutgoing(out: OutgoingState, error?: string): void {
    if (error) out.error = error;
    this.onUpdate({
      id: out.id,
      peerId: out.peerId,
      peerName: out.peerName,
      fileName: out.file.name,
      fileSize: out.file.size,
      mimeType: out.file.type,
      direction: "outgoing",
      status: out.status,
      progress:
        out.file.size > 0
          ? Math.min(100, (out.bytesSent / out.file.size) * 100)
          : 0,
      speedBps: 0,
      etaSeconds: null,
      error: out.error,
    });
  }

  private emitIncoming(inc: IncomingState): void {
    this.onUpdate({
      id: inc.id,
      peerId: inc.peerId,
      peerName: inc.peerName,
      fileName: inc.name,
      fileSize: inc.size,
      mimeType: inc.mime,
      direction: "incoming",
      status: inc.status,
      progress: inc.size > 0 ? (inc.totalReceived / inc.size) * 100 : 0,
      speedBps: 0,
      etaSeconds: null,
    });
  }
}
