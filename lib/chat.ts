import type { ChatMessage, DeviceId, WireChatMessage } from "@/types";

export function wireToIncomingChat(
  peerId: DeviceId,
  peerName: string,
  wire: WireChatMessage
): ChatMessage {
  return {
    id: `${wire.timestamp}-${peerId}-${wire.type}`,
    type: wire.type,
    data: wire.data,
    timestamp: wire.timestamp,
    peerId: wire.senderId || peerId,
    peerName: wire.senderName || peerName,
    direction: "incoming",
  };
}

export function createOutgoingChat(
  type: "text" | "link",
  data: string,
  peerId: DeviceId,
  peerName: string,
  localId: DeviceId,
  localName: string
): { wire: WireChatMessage; ui: ChatMessage } {
  const timestamp = Date.now();
  const wire: WireChatMessage = {
    type,
    data,
    timestamp,
    senderId: localId,
    senderName: localName,
  };
  const ui: ChatMessage = {
    id: `${timestamp}-${localId}-out`,
    type,
    data,
    timestamp,
    peerId,
    peerName,
    direction: "outgoing",
  };
  return { wire, ui };
}

export function filterMessagesForPeer(
  messages: ChatMessage[],
  selectedPeerId: string | null
): ChatMessage[] {
  if (!selectedPeerId) {
    return [...messages].sort((a, b) => a.timestamp - b.timestamp);
  }
  return messages
    .filter((m) => m.peerId === selectedPeerId)
    .sort((a, b) => a.timestamp - b.timestamp);
}
