"use client";

import { CHUNK_SIZE, MAX_PENDING_CHUNKS } from "@/lib/constants";
import { encodeChunk } from "@/lib/protocol";
import type { ControlMessage, DeviceId, TransferItem, TransferStatus } from "@/types";

type TransferUpdate = (item: TransferItem) => void;

interface OutgoingState {
  file: File;
  peerId: DeviceId;
  peerName: string;
  id: string;
  chunkIndex: number;
  ackedIndex: number;
  pending: number;
  bytesSent: number;
  startedAt: number;
  lastSpeedAt: number;
  lastSpeedBytes: number;
  aborted: boolean;
  status: TransferStatus;
}

interface IncomingState {
  id: string;
  peerId: DeviceId;
  peerName: string;
  name: string;
  size: number;
  mime: string;
  parts: BlobPart[];
  nextExpected: number;
  totalReceived: number;
  status: TransferStatus;
  startedAt: number;
  completing: boolean;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TransferEngine {
  private outgoing = new Map<string, OutgoingState>();
  private incoming = new Map<string, IncomingState>();
  private onUpdate: TransferUpdate;
  private sendRaw: (peerId: DeviceId, data: ArrayBuffer) => boolean;
  private sendControl: (peerId: DeviceId, msg: ControlMessage) => boolean;

  constructor(
    onUpdate: TransferUpdate,
    sendRaw: (peerId: DeviceId, data: ArrayBuffer) => boolean,
    sendControl: (peerId: DeviceId, msg: ControlMessage) => boolean
  ) {
    this.onUpdate = onUpdate;
    this.sendRaw = sendRaw;
    this.sendControl = sendControl;
  }

  private sendAck(peerId: DeviceId, transferId: string, index: number, attempt = 0): void {
    const msg: ControlMessage = { type: "chunk-ack", id: transferId, index };
    if (this.sendControl(peerId, msg)) return;
    if (attempt < 20) {
      setTimeout(() => this.sendAck(peerId, transferId, index, attempt + 1), 50);
    }
  }

  requestSend(file: File, peerId: DeviceId, peerName: string): string {
    const id = crypto.randomUUID();
    const item: TransferItem = {
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
    };
    this.outgoing.set(id, {
      file,
      peerId,
      peerName,
      id,
      chunkIndex: 0,
      ackedIndex: -1,
      pending: 0,
      bytesSent: 0,
      startedAt: Date.now(),
      lastSpeedAt: Date.now(),
      lastSpeedBytes: 0,
      aborted: false,
      status: "awaiting-accept",
    });
    this.onUpdate(item);
    this.sendControl(peerId, {
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
      case "transfer-request":
        this.incoming.set(msg.id, {
          id: msg.id,
          peerId,
          peerName,
          name: msg.name,
          size: msg.size,
          mime: msg.mime,
          parts: [],
          nextExpected: 0,
          totalReceived: 0,
          status: "awaiting-accept",
          startedAt: Date.now(),
          completing: false,
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
      case "text":
      case "link":
        break;
    }
  }

  acceptIncoming(id: string): void {
    const inc = this.incoming.get(id);
    if (!inc) return;
    inc.status = "transferring";
    inc.startedAt = Date.now();
    this.sendControl(inc.peerId, { type: "transfer-accept", id });
    this.emitIncoming(inc);
  }

  rejectIncoming(id: string): void {
    const inc = this.incoming.get(id);
    if (!inc) return;
    this.sendControl(inc.peerId, { type: "transfer-reject", id });
    inc.status = "rejected";
    this.emitIncoming(inc);
    this.incoming.delete(id);
  }

  cancelTransfer(id: string): void {
    const out = this.outgoing.get(id);
    const inc = this.incoming.get(id);
    if (out) {
      out.aborted = true;
      this.sendControl(out.peerId, { type: "transfer-cancel", id });
      this.finishOutgoing(id, "cancelled");
    }
    if (inc) {
      this.sendControl(inc.peerId, { type: "transfer-cancel", id });
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
    out.chunkIndex = out.ackedIndex + 1;
    out.pending = 0;
    this.sendControl(out.peerId, {
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
    this.emitOutgoing(out);
    await this.pumpChunks(id);
  }

  private async resumeOutgoing(id: string, fromChunk: number): Promise<void> {
    const out = this.outgoing.get(id);
    if (!out) return;
    out.chunkIndex = fromChunk;
    out.ackedIndex = fromChunk - 1;
    out.status = "transferring";
    await this.pumpChunks(id);
  }

  private async sendChunkWithBackoff(
    peerId: DeviceId,
    packet: ArrayBuffer,
    out: OutgoingState
  ): Promise<boolean> {
    for (let attempt = 0; attempt < 200; attempt++) {
      if (out.aborted) return false;
      if (this.sendRaw(peerId, packet)) return true;
      await sleep(25);
    }
    return false;
  }

  private async pumpChunks(id: string): Promise<void> {
    const out = this.outgoing.get(id);
    if (!out || out.aborted || out.status !== "transferring") return;

    const totalChunks = totalChunkCount(out.file.size);

    while (
      out.pending < MAX_PENDING_CHUNKS &&
      out.chunkIndex < totalChunks &&
      !out.aborted
    ) {
      const index = out.chunkIndex;
      const start = index * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, out.file.size);
      const buffer = await out.file.slice(start, end).arrayBuffer();
      const packet = encodeChunk(id, index, buffer);

      const sent = await this.sendChunkWithBackoff(out.peerId, packet, out);
      if (!sent) {
        out.status = "failed";
        this.emitOutgoing(out);
        return;
      }

      out.pending++;
      out.chunkIndex++;
    }

    this.checkOutgoingComplete(out);
  }

  private handleAck(id: string, index: number): void {
    const out = this.outgoing.get(id);
    if (!out || out.status !== "transferring") return;
    if (index < 0 || index <= out.ackedIndex) return;

    const totalChunks = totalChunkCount(out.file.size);
    const targetIndex = Math.min(index, totalChunks - 1);

    for (let i = out.ackedIndex + 1; i <= targetIndex; i++) {
      out.bytesSent += chunkByteLength(out.file.size, i);
    }

    const ackedDelta = targetIndex - out.ackedIndex;
    out.pending = Math.max(0, out.pending - ackedDelta);
    out.ackedIndex = targetIndex;

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
    });

    void this.pumpChunks(id);
    this.checkOutgoingComplete(out);
  }

  private checkOutgoingComplete(out: OutgoingState): void {
    const totalChunks = totalChunkCount(out.file.size);
    const allSent = out.chunkIndex >= totalChunks;
    const allAcked = out.ackedIndex >= totalChunks - 1;

    if (
      allSent &&
      allAcked &&
      out.pending === 0 &&
      out.status === "transferring" &&
      !out.aborted
    ) {
      this.sendControl(out.peerId, { type: "transfer-complete", id: out.id });
      this.finishOutgoing(out.id, "completed");
    }
  }

  handleChunk(
    peerId: DeviceId,
    peerName: string,
    transferId: string,
    index: number,
    data: ArrayBuffer
  ): void {
    const inc = this.incoming.get(transferId);
    if (!inc || inc.status !== "transferring" || inc.completing) return;

    const totalChunks = totalChunkCount(inc.size);

    if (index < inc.nextExpected) {
      this.sendAck(peerId, transferId, index);
      return;
    }

    if (index > inc.nextExpected) {
      return;
    }

    inc.parts.push(data);
    inc.totalReceived += data.byteLength;
    this.sendAck(peerId, transferId, index);
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

    if (inc.nextExpected >= totalChunks || inc.totalReceived >= inc.size) {
      void this.completeIncoming(inc);
    }
  }

  private async completeIncoming(inc: IncomingState): Promise<void> {
    if (inc.completing) return;
    inc.completing = true;

    const totalChunks = totalChunkCount(inc.size);
    if (inc.parts.length < totalChunks) {
      inc.completing = false;
      return;
    }

    try {
      const blob = new Blob(inc.parts, { type: inc.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = inc.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

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
      });
      this.sendControl(inc.peerId, { type: "transfer-complete", id: inc.id });
    } finally {
      this.incoming.delete(inc.id);
    }
  }

  private finishOutgoing(id: string, status: TransferStatus): void {
    const out = this.outgoing.get(id);
    if (!out) return;
    out.status = status;
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
    });
    if (status === "completed" || status === "cancelled" || status === "rejected") {
      this.outgoing.delete(id);
    }
  }

  private emitOutgoing(out: OutgoingState): void {
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

  getPendingIncoming(): IncomingState[] {
    return [...this.incoming.values()].filter((i) => i.status === "awaiting-accept");
  }
}
