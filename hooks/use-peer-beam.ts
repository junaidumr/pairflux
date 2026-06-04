"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getAvatarColor,
  getOrCreateDeviceId,
  getOrCreateDeviceName,
  getRoomId,
  setDeviceName,
} from "@/lib/device";
import { SignalingClient } from "@/lib/signaling";
import { createOutgoingChat, wireToIncomingChat } from "@/lib/chat";
import { TransferEngine } from "@/lib/transfer";
import { WebRTCManager } from "@/lib/webrtc";
import type { ChatMessage, PeerDevice, TransferItem } from "@/types";

export function usePeerBeam() {
  const [peers, setPeers] = useState<PeerDevice[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setNameState] = useState("");
  const [roomId, setRoomId] = useState("public");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
    setNameState(getOrCreateDeviceName());
    setRoomId(getRoomId());
    setInitialized(true);
  }, []);

  const signalingRef = useRef<SignalingClient | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const transferRef = useRef<TransferEngine | null>(null);
  const peerNamesRef = useRef<Map<string, string>>(new Map());

  const updateTransfer = useCallback((item: TransferItem) => {
    setTransfers((prev) => {
      const idx = prev.findIndex((t) => t.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...item };
        return next;
      }
      return [item, ...prev];
    });
  }, []);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  useEffect(() => {
    if (!initialized || !deviceId) return;

    const signaling = new SignalingClient();
    signalingRef.current = signaling;

    const sendSignal = (payload: Parameters<SignalingClient["sendSignal"]>[0]) => {
      signaling.sendSignal(payload);
    };

    const webrtc = new WebRTCManager(
      deviceId,
      sendSignal,
      (peerId, data) => {
        const parsed = webrtc.handleIncomingData(peerId, data);
        if (!parsed) return;
        const peerName = peerNamesRef.current.get(peerId) ?? "Peer";

        if (parsed.kind === "chat") {
          appendMessage(wireToIncomingChat(peerId, peerName, parsed.message));
          return;
        }

        if (parsed.kind === "control") {
          void transferRef.current?.handleControl(peerId, peerName, parsed.message);
          return;
        }

        if (parsed.kind === "chunk") {
          void transferRef.current?.handleChunk(
            peerId,
            peerName,
            parsed.transferId,
            parsed.index,
            parsed.data
          );
        }
      },
      (peerId, connected) => {
        setConnectedPeers((prev) => {
          const next = new Set(prev);
          if (connected) next.add(peerId);
          else next.delete(peerId);
          return next;
        });
      },
      (peerId, state) => {
        transferRef.current?.onPeerConnectionState(peerId, state);
      }
    );
    webrtcRef.current = webrtc;

    transferRef.current = new TransferEngine(
      updateTransfer,
      (peerId, data) => webrtc.sendRaw(peerId, data),
      (peerId, msg) => webrtc.sendControl(peerId, msg),
      (peerId) => webrtc.isConnected(peerId),
      (peerId) => webrtc.getBufferedAmount(peerId)
    );

    const avatar = getAvatarColor(deviceId);
    signaling.connect(deviceId, deviceName, avatar, roomId);

    const unsubs = [
      signaling.on("joined", ({ peers: initial }) => {
        setPeers(initial);
        initial.forEach((p) => peerNamesRef.current.set(p.id, p.name));
        setReady(true);
        initial.forEach((p) => void webrtc.connectToPeer(p.id, deviceId > p.id));
      }),
      signaling.on("peers", (list) => {
        setPeers(list);
        list.forEach((p) => peerNamesRef.current.set(p.id, p.name));
      }),
      signaling.on("peer-joined", (peer) => {
        peerNamesRef.current.set(peer.id, peer.name);
        setPeers((prev) => {
          if (prev.some((p) => p.id === peer.id)) return prev;
          return [...prev, peer];
        });
        void webrtc.connectToPeer(peer.id, deviceId > peer.id);
      }),
      signaling.on("peer-left", ({ id }) => {
        setPeers((prev) => prev.filter((p) => p.id !== id));
        webrtc.disconnectPeer(id);
      }),
      signaling.on("signal", (payload) => {
        void webrtc.handleSignal(payload);
      }),
      signaling.on("disconnect", () => setReady(false)),
      signaling.on("connect", () => setReady(true)),
    ];

    const heartbeat = setInterval(() => signaling.heartbeat(), 15000);

    return () => {
      clearInterval(heartbeat);
      unsubs.forEach((u) => u());
      webrtc.disconnectAll();
      signaling.disconnect();
    };
  }, [initialized, deviceId, deviceName, roomId, updateTransfer, appendMessage]);

  const connectToPeer = useCallback(async (peerId: string) => {
    await webrtcRef.current?.connectToPeer(peerId, deviceId > peerId);
  }, [deviceId]);

  const ensurePeerReady = useCallback(
    async (peerId: string, peerName: string): Promise<boolean> => {
      if (webrtcRef.current?.isConnected(peerId)) return true;
      await connectToPeer(peerId);
      if (webrtcRef.current?.isConnected(peerId)) return true;
      toast.error(`Could not connect to ${peerName}`);
      return false;
    },
    [connectToPeer]
  );

  const sendFiles = useCallback(
    async (files: FileList | File[], targetPeerId?: string) => {
      const list = Array.from(files);
      const targets = targetPeerId
        ? peers.filter((p) => p.id === targetPeerId)
        : peers;

      if (targets.length === 0) {
        toast.error("No peers online to send files to");
        return;
      }

      for (const file of list) {
        for (const peer of targets) {
          if (!webrtcRef.current?.isConnected(peer.id)) {
            await connectToPeer(peer.id);
          }
          if (!webrtcRef.current?.isConnected(peer.id)) {
            toast.error(`Could not connect to ${peer.name}`);
            continue;
          }
          transferRef.current?.requestSend(file, peer.id, peer.name);
        }
      }
    },
    [peers, connectToPeer]
  );

  const sendText = useCallback(
    async (content: string, targetPeerId?: string) => {
      const targets = targetPeerId
        ? peers.filter((p) => p.id === targetPeerId)
        : peers;
      if (targets.length === 0) {
        toast.error("No peers online");
        return;
      }

      let sentCount = 0;
      for (const peer of targets) {
        if (!(await ensurePeerReady(peer.id, peer.name))) continue;
        const { wire, ui } = createOutgoingChat(
          "text",
          content,
          peer.id,
          peer.name,
          deviceId,
          deviceName
        );
        const ok = await webrtcRef.current?.sendChat(peer.id, wire);
        if (ok) {
          appendMessage(ui);
          sentCount++;
        } else {
          toast.error(`Failed to send to ${peer.name}`);
        }
      }
      if (sentCount > 0) toast.success("Message sent");
    },
    [peers, deviceId, deviceName, ensurePeerReady, appendMessage]
  );

  const sendLink = useCallback(
    async (url: string, targetPeerId?: string) => {
      try {
        new URL(url);
      } catch {
        toast.error("Invalid URL");
        return;
      }
      const targets = targetPeerId
        ? peers.filter((p) => p.id === targetPeerId)
        : peers;
      if (targets.length === 0) {
        toast.error("No peers online");
        return;
      }

      let sentCount = 0;
      for (const peer of targets) {
        if (!(await ensurePeerReady(peer.id, peer.name))) continue;
        const { wire, ui } = createOutgoingChat(
          "link",
          url,
          peer.id,
          peer.name,
          deviceId,
          deviceName
        );
        const ok = await webrtcRef.current?.sendChat(peer.id, wire);
        if (ok) {
          appendMessage(ui);
          sentCount++;
        } else {
          toast.error(`Failed to send link to ${peer.name}`);
        }
      }
      if (sentCount > 0) toast.success("Link sent");
    },
    [peers, deviceId, deviceName, ensurePeerReady, appendMessage]
  );

  const rename = useCallback((name: string) => {
    setDeviceName(name);
    setNameState(getOrCreateDeviceName());
  }, []);

  return {
    peers,
    transfers,
    messages,
    connectedPeers,
    initialized,
    deviceId,
    deviceName,
    roomId,
    ready: ready && initialized,
    connectToPeer,
    sendFiles,
    sendText,
    sendLink,
    rename,
    acceptTransfer: (id: string) => void transferRef.current?.acceptIncoming(id),
    rejectTransfer: (id: string) => transferRef.current?.rejectIncoming(id),
    cancelTransfer: (id: string) => transferRef.current?.cancelTransfer(id),
    retryTransfer: (id: string) => transferRef.current?.retryOutgoing(id),
    isPeerConnected: (id: string) => connectedPeers.has(id),
  };
}
