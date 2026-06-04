import type { ControlMessage } from "@/types";

const CTRL_PREFIX = 0x01;
const CHUNK_PREFIX = 0x02;

export function encodeControl(msg: ControlMessage): ArrayBuffer {
  const json = JSON.stringify(msg);
  const enc = new TextEncoder().encode(json);
  const buf = new ArrayBuffer(1 + enc.length);
  const view = new Uint8Array(buf);
  view[0] = CTRL_PREFIX;
  view.set(enc, 1);
  return buf;
}

export function encodeChunk(transferId: string, index: number, data: ArrayBuffer): ArrayBuffer {
  const idBytes = new TextEncoder().encode(transferId);
  const headerLen = 1 + 2 + idBytes.length + 4 + 4;
  const buf = new ArrayBuffer(headerLen + data.byteLength);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  let offset = 0;
  bytes[offset++] = CHUNK_PREFIX;
  view.setUint16(offset, idBytes.length, true);
  offset += 2;
  bytes.set(idBytes, offset);
  offset += idBytes.length;
  view.setUint32(offset, index, true);
  offset += 4;
  view.setUint32(offset, data.byteLength, true);
  offset += 4;
  bytes.set(new Uint8Array(data), offset);
  return buf;
}

export type ParsedMessage =
  | { kind: "control"; message: ControlMessage }
  | { kind: "chunk"; transferId: string; index: number; data: ArrayBuffer };

export function parseMessage(raw: ArrayBuffer | string): ParsedMessage | null {
  if (typeof raw === "string") {
    try {
      return { kind: "control", message: JSON.parse(raw) as ControlMessage };
    } catch {
      return null;
    }
  }

  const bytes = new Uint8Array(raw);
  if (bytes.length < 2) return null;

  if (bytes[0] === CTRL_PREFIX) {
    try {
      const json = new TextDecoder().decode(bytes.subarray(1));
      return { kind: "control", message: JSON.parse(json) as ControlMessage };
    } catch {
      return null;
    }
  }

  if (bytes[0] === CHUNK_PREFIX && bytes.length >= 11) {
    const view = new DataView(raw);
    let offset = 1;
    const idLen = view.getUint16(offset, true);
    offset += 2;
    const transferId = new TextDecoder().decode(bytes.subarray(offset, offset + idLen));
    offset += idLen;
    const index = view.getUint32(offset, true);
    offset += 4;
    const size = view.getUint32(offset, true);
    offset += 4;
    const data = raw.slice(offset, offset + size);
    return { kind: "chunk", transferId, index, data };
  }

  return null;
}
