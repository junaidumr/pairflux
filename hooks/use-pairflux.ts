"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createOutgoingChat, wireToIncomingChat } from "@/lib/chat";
import {
  getAvatarColor,
  getOrCreateDeviceId,
  getOrCreateDeviceName,
  getRoomId,
  setDeviceName,
} from "@/lib/device";
import { generatePairingCode } from "@/lib/pairing-code";
import { SignalingClient } from "@/lib/signaling";
import {
  addTrustedPeer,
  getTrustedPeerIds,
  isTrustedPeer,
} from "@/lib/trusted-peers";
import { TransferEngine } from "@/lib/transfer";
import { WebRTCManager } from "@/lib/webrtc";
import type {
  ChatMessage,
  PairingPhase,
  PairingSuccessPayload,
  PeerDevice,
  TransferItem,
} from "@/types";

export function usePairflux() {
  const [peers, setPeers] = useState<PeerDevice[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());
  const [pairedPeerIds, setPairedPeerIds] = useState<Set<string>>(() => new Set());
  const [initialized, setInitialized] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setNameState] = useState("");
  const [roomId, setRoomId] = useState("public");
  const [ready, setReady] = useState(false);

  const [pairingPhase, setPairingPhase] = useState<PairingPhase>("idle");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [lastPairedPeerId, setLastPairedPeerId] = useState<string | null>(null);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
    setNameState(getOrCreateDeviceName());
    setRoomId(getRoomId());
    setPairedPeerIds(new Set(getTrustedPeerIds()));
    setInitialized(true);
  }, []);

  const signalingRef = useRef<SignalingClient | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const transferRef = useRef<TransferEngine | null>(null);
  const peerNamesRef = useRef<Map<string, string>>(new Map());
  const pairedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    pairedRef.current = pairedPeerIds;
  }, [pairedPeerIds]);

  const markPaired = useCallback((peerId: string) => {
    setPairedPeerIds((prev) => {
      if (prev.has(peerId)) return prev;
      const next = new Set(prev);
      next.add(peerId);
      return next;
    });
  }, []);

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

  const connectToPeer = useCallback(async (peerId: string) => {
    await webrtcRef.current?.connectToPeer(peerId, deviceId > peerId);
  }, [deviceId]);

  const connectIfPaired = useCallback(
    (peerId: string) => {
      if (!pairedRef.current.has(peerId) && !isTrustedPeer(peerId)) return;
      void connectToPeer(peerId);
    },
    [connectToPeer]
  );

  const handlePairingSuccess = useCallback(
    (payload: PairingSuccessPayload) => {
      const { sessionId, peerId, peerName, peerAvatar } = payload;
      peerNamesRef.current.set(peerId, peerName);
      addTrustedPeer({
        peerId,
        sessionId,
        peerName,
        timestamp: Date.now(),
      });
      markPaired(peerId);
      setPairingPhase("success");
      setPairingCode(null);
      setPairingError(null);
      setLastPairedPeerId(peerId);
      setPeers((prev) => {
        if (prev.some((p) => p.id === peerId)) return prev;
        return [
          ...prev,
          {
            id: peerId,
            name: peerName,
            avatar: peerAvatar ?? "device",
            online: true,
          },
        ];
      });
      void connectToPeer(peerId);
      toast.success(`Paired with ${peerName}`);
    },
    [connectToPeer, markPaired]
  );

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
    const signalingConfigured = signaling.connect(deviceId, deviceName, avatar, roomId);

    const unsubs = [
      signaling.on("joined", ({ peers: initial }) => {
        setPeers(initial);
        initial.forEach((p) => peerNamesRef.current.set(p.id, p.name));
        setReady(true);
        initial.forEach((p) => connectIfPaired(p.id));
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
        connectIfPaired(peer.id);
      }),
      signaling.on("peer-left", ({ id }) => {
        setPeers((prev) => prev.filter((p) => p.id !== id));
        webrtc.disconnectPeer(id);
      }),
      signaling.on("signal", (payload) => {
        void webrtc.handleSignal(payload);
      }),
      signaling.on("pairing-code-ack", ({ code }) => {
        setPairingCode(code);
        setPairingPhase("hosting");
        setPairingError(null);
      }),
      signaling.on("pairing-success", handlePairingSuccess),
      signaling.on("pairing-failed", ({ message }) => {
        setPairingPhase("error");
        setPairingError(message);
        toast.error(message);
      }),
      signaling.on("disconnect", () => setReady(false)),
      signaling.on("connect", () => setReady(true)),
      signaling.on("connect-error", ({ message }) => {
        toast.error(`Cannot reach signaling server: ${message}`, { id: "signaling-error" });
      }),
    ];

    if (!signalingConfigured) {
      toast.error(
        "Signaling server not configured. Deploy server/index.ts, then set NEXT_PUBLIC_SIGNALING_URL in Vercel and redeploy.",
        { id: "signaling-error", duration: 12_000 }
      );
    }

    const heartbeat = setInterval(() => signaling.heartbeat(), 15000);

    return () => {
      clearInterval(heartbeat);
      unsubs.forEach((u) => u());
      webrtc.disconnectAll();
      signaling.disconnect();
    };
  }, [
    initialized,
    deviceId,
    deviceName,
    roomId,
    updateTransfer,
    appendMessage,
    connectIfPaired,
    handlePairingSuccess,
  ]);

  const startPairingHost = useCallback(() => {
    if (!signalingRef.current?.connected) {
      toast.error("Not connected to signaling server");
      return;
    }
    const code = generatePairingCode();
    setPairingCode(code);
    setPairingPhase("hosting");
    setPairingError(null);
    signalingRef.current.emitPairingCode(code, deviceId);
  }, [deviceId]);

  const cancelPairingHost = useCallback(() => {
    if (pairingCode) {
      signalingRef.current?.emitPairingCancel(pairingCode, deviceId);
    }
    setPairingCode(null);
    setPairingPhase("idle");
    setPairingError(null);
  }, [pairingCode, deviceId]);

  const verifyPairingCode = useCallback(
    (code: string) => {
      if (!signalingRef.current?.connected) {
        toast.error("Not connected to signaling server");
        return;
      }
      setPairingPhase("verifying");
      setPairingError(null);
      signalingRef.current.emitPairingVerify(code, deviceId);
    },
    [deviceId]
  );

  const resetPairingUi = useCallback(() => {
    setPairingPhase("idle");
    setPairingError(null);
    setPairingCode(null);
  }, []);

  const requestConnectToPeer = useCallback(
    async (peerId: string) => {
      const name = peerNamesRef.current.get(peerId) ?? "Peer";
      if (pairedRef.current.has(peerId) || isTrustedPeer(peerId)) {
        if (!pairedRef.current.has(peerId)) markPaired(peerId);
        await connectToPeer(peerId);
        return true;
      }
      toast.info(`Pair with ${name} using the 3-digit code below`);
      return false;
    },
    [connectToPeer, markPaired]
  );

  const ensurePeerReady = useCallback(
    async (peerId: string, peerName: string): Promise<boolean> => {
      if (!pairedRef.current.has(peerId)) {
        toast.error(`Pair with ${peerName} first`);
        return false;
      }
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
        : peers.filter((p) => pairedRef.current.has(p.id));

      if (targets.length === 0) {
        toast.error("No paired peers — enter a code or pair first");
        return;
      }

      for (const file of list) {
        for (const peer of targets) {
          if (!(await ensurePeerReady(peer.id, peer.name))) continue;
          transferRef.current?.requestSend(file, peer.id, peer.name);
        }
      }
    },
    [peers, ensurePeerReady]
  );

  const sendText = useCallback(
    async (content: string, targetPeerId?: string) => {
      const targets = targetPeerId
        ? peers.filter((p) => p.id === targetPeerId)
        : peers.filter((p) => pairedRef.current.has(p.id));
      if (targets.length === 0) {
        toast.error("No paired peers online");
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
        : peers.filter((p) => pairedRef.current.has(p.id));
      if (targets.length === 0) {
        toast.error("No paired peers online");
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

  const isPairedWith = useCallback(
    (peerId: string) => pairedPeerIds.has(peerId),
    [pairedPeerIds]
  );

  const hasPairedConnection = useMemo(() => {
    return peers.some(
      (p) => pairedPeerIds.has(p.id) && connectedPeers.has(p.id)
    );
  }, [peers, pairedPeerIds, connectedPeers]);

  return {
    peers,
    transfers,
    messages,
    connectedPeers,
    pairedPeerIds,
    pairingPhase,
    pairingCode,
    pairingError,
    lastPairedPeerId,
    hasPairedConnection,
    initialized,
    deviceId,
    deviceName,
    roomId,
    ready: ready && initialized,
    connectToPeer: requestConnectToPeer,
    startPairingHost,
    cancelPairingHost,
    verifyPairingCode,
    resetPairingUi,
    sendFiles,
    sendText,
    sendLink,
    rename,
    isPairedWith,
    acceptTransfer: (id: string) => void transferRef.current?.acceptIncoming(id),
    rejectTransfer: (id: string) => transferRef.current?.rejectIncoming(id),
    cancelTransfer: (id: string) => transferRef.current?.cancelTransfer(id),
    retryTransfer: (id: string) => transferRef.current?.retryOutgoing(id),
    isPeerConnected: (id: string) => connectedPeers.has(id),
  };
}
