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
  | { type: "text"; content: string }
  | { type: "link"; url: string }
  | { type: "ping" }
  | { type: "pong" };

export interface ChunkHeader {
  transferId: string;
  index: number;
}

export interface PairingPayload {
  room: string;
  deviceId: DeviceId;
  origin: string;
}
