import type { ControlMessage, WireChatMessage } from "@/types";

const CTRL_PREFIX = 0x01;
const CHUNK_PREFIX = 0x02;
const TEXT_PREFIX = 0x03;

export function encodeControl(msg: ControlMessage): ArrayBuffer {
  const json = JSON.stringify(msg);
  const enc = new TextEncoder().encode(json);
  const buf = new ArrayBuffer(1 + enc.length);
  const view = new Uint8Array(buf);
  view[0] = CTRL_PREFIX;
  view.set(enc, 1);
  return buf;
}

export function encodeWireChat(msg: WireChatMessage): ArrayBuffer {
  const json = JSON.stringify(msg);
  const enc = new TextEncoder().encode(json);
  const buf = new ArrayBuffer(1 + enc.length);
  const view = new Uint8Array(buf);
  view[0] = TEXT_PREFIX;
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
  | { kind: "chat"; message: WireChatMessage }
  | { kind: "chunk"; transferId: string; index: number; data: ArrayBuffer };

function parseJsonChat(raw: string): WireChatMessage | null {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const type = obj.type;
    if (type !== "text" && type !== "link") return null;
    const data =
      typeof obj.data === "string"
        ? obj.data
        : typeof obj.content === "string"
          ? obj.content
          : null;
    if (!data) return null;
    const timestamp =
      typeof obj.timestamp === "number" ? obj.timestamp : Date.now();
    const senderId = typeof obj.senderId === "string" ? obj.senderId : "";
    const senderName = typeof obj.senderName === "string" ? obj.senderName : "Peer";
    return { type, data, timestamp, senderId, senderName };
  } catch {
    return null;
  }
}

function parsePrefixedJson(
  bytes: Uint8Array,
  prefix: number
): ControlMessage | WireChatMessage | null {
  if (bytes.length < 2 || bytes[0] !== prefix) return null;
  try {
    const json = new TextDecoder().decode(bytes.subarray(1));
    const obj = JSON.parse(json) as Record<string, unknown>;
    if (prefix === TEXT_PREFIX) {
      return parseJsonChat(json);
    }
    return obj as ControlMessage;
  } catch {
    return null;
  }
}

export function parseMessage(raw: ArrayBuffer | string): ParsedMessage | null {
  if (typeof raw === "string") {
    const chat = parseJsonChat(raw);
    if (chat) return { kind: "chat", message: chat };
    try {
      return { kind: "control", message: JSON.parse(raw) as ControlMessage };
    } catch {
      return null;
    }
  }

  const bytes = new Uint8Array(raw);
  if (bytes.length < 2) return null;

  if (bytes[0] === CTRL_PREFIX) {
    const msg = parsePrefixedJson(bytes, CTRL_PREFIX);
    if (!msg) return null;
    if ("type" in msg && (msg.type === "text" || msg.type === "link")) {
      const legacy = msg as { type: "text" | "link"; content?: string; url?: string };
      const data =
        legacy.type === "text"
          ? (legacy.content ?? "")
          : (legacy.url ?? "");
      return {
        kind: "chat",
        message: {
          type: legacy.type,
          data,
          timestamp: Date.now(),
          senderId: "",
          senderName: "Peer",
        },
      };
    }
    return { kind: "control", message: msg as ControlMessage };
  }

  if (bytes[0] === TEXT_PREFIX) {
    const chat = parsePrefixedJson(bytes, TEXT_PREFIX);
    if (chat && (chat.type === "text" || chat.type === "link")) {
      return { kind: "chat", message: chat };
    }
    return null;
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