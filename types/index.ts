export type DeviceId = string;

export interface PeerDevice {
  id: DeviceId;
  name: string;
  avatar: string;
  online: boolean;
}

export type SignalType = "offer" | "answer" | "ice";

export interface SignalPayload {
  type: SignalType;
  from: DeviceId;
  to: DeviceId;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export type TransferDirection = "incoming" | "outgoing";

export type TransferStatus =
  | "pending"
  | "awaiting-accept"
  | "transferring"
  | "completed"
  | "rejected"
  | "cancelled"
  | "failed";

export interface TransferItem {
  id: string;
  peerId: DeviceId;
  peerName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  direction: TransferDirection;
  status: TransferStatus;
  progress: number;
  speedBps: number;
  etaSeconds: number | null;
  error?: string;
}

export type ControlMessage =
  | { type: "transfer-request"; id: string; name: string; size: number; mime: string }
  | { type: "transfer-accept"; id: string }
  | { type: "transfer-reject"; id: string }
  | { type: "transfer-cancel"; id: string }
  | { type: "transfer-complete"; id: string }
  | { type: "transfer-resume"; id: string; fromChunk: number }
  | { type: "chunk-meta"; id: string; index: number; size: number }
  | { type: "chunk-ack"; id: string; index: number }
  | { type: "ping" }
  | { type: "pong" };

/** Wire format for real-time chat over the data channel (see encodeWireChat). */
export type WireChatMessage = {
  type: "text" | "link";
  data: string;
  timestamp: number;
  senderId: DeviceId;
  senderName: string;
};

export type ChatMessageDirection = "incoming" | "outgoing";

export interface ChatMessage {
  id: string;
  type: "text" | "link";
  data: string;
  timestamp: number;
  peerId: DeviceId;
  peerName: string;
  direction: ChatMessageDirection;
}

export interface ChunkHeader {
  transferId: string;
  index: number;
}

export interface PairingPayload {
  room: string;
  deviceId: DeviceId;
  origin: string;
}

export type PairingPhase = "idle" | "hosting" | "verifying" | "success" | "error";

export interface PairingCodePayload {
  type: "pairing-code";
  code: string;
  from: DeviceId;
}

export interface PairingVerifyPayload {
  type: "pairing-verify";
  code: string;
  deviceId: DeviceId;
}

export interface PairingSuccessPayload {
  type: "pairing-success";
  sessionId: string;
  peerId: DeviceId;
  peerName: string;
  peerAvatar?: string;
}

export interface PairingFailedPayload {
  type: "pairing-failed";
  message: string;
  reason?: string;
}

export interface TrustedPeerRecord {
  peerId: DeviceId;
  sessionId: string;
  peerName?: string;
  timestamp: number;
}
