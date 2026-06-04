"use client";

import { Activity, Share2, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/share/app-header";
import { AppShell } from "@/components/share/app-shell";
import { DeviceList } from "@/components/share/device-list";
import { DropZone } from "@/components/share/drop-zone";
import { RecipientBar } from "@/components/share/recipient-bar";
import { ChatPanel } from "@/components/share/chat-panel";
import { PairingPanel } from "@/components/share/pairing-panel";
import { TransferDialog } from "@/components/share/transfer-dialog";
import { TransferPanel } from "@/components/share/transfer-panel";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { MeshBackground } from "@/components/layout/mesh-background";
import { filterMessagesForPeer } from "@/lib/chat";
import { usePeerBeam } from "@/hooks/use-peer-beam";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PairingPayload } from "@/types";

type MobileTab = "devices" | "share" | "transfers";

function ShareWorkspace({
  peers,
  deviceId,
  deviceName,
  connectedPeers,
  pairedPeerIds,
  selectedPeerId,
  onSelectPeer,
  onConnect,
  selectedPeerName,
  otherPeerCount,
  ready,
  hasPairedConnection,
  pairingPhase,
  pairingCode,
  pairingError,
  onStartPairingHost,
  onCancelPairingHost,
  onVerifyPairingCode,
  onDismissPairingSuccess,
  transfers,
  onFiles,
  messages,
  onSendText,
  onSendLink,
  onCancel,
  onRetry,
  onClearSelection,
}: {
  peers: Parameters<typeof DeviceList>[0]["peers"];
  deviceId: string;
  deviceName: string;
  connectedPeers: Set<string>;
  pairedPeerIds: Set<string>;
  selectedPeerId: string | null;
  onSelectPeer: (id: string | null) => void;
  onConnect: (id: string) => void;
  selectedPeerName: string | null;
  otherPeerCount: number;
  ready: boolean;
  hasPairedConnection: boolean;
  pairingPhase: Parameters<typeof PairingPanel>[0]["phase"];
  pairingCode: string | null;
  pairingError: string | null;
  onStartPairingHost: () => void;
  onCancelPairingHost: () => void;
  onVerifyPairingCode: (code: string) => void;
  onDismissPairingSuccess: () => void;
  transfers: Parameters<typeof TransferPanel>[0]["transfers"];
  onFiles: (files: FileList | File[]) => void;
  messages: Parameters<typeof ChatPanel>[0]["messages"];
  onSendText: (t: string) => void | Promise<void>;
  onSendLink: (u: string) => void | Promise<void>;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onClearSelection: () => void;
}) {
  const shareDisabled = !ready || otherPeerCount === 0 || !hasPairedConnection;
  const pairingDisabled = !ready;

  return (
    <AppShell className="min-h-[calc(100vh-7.5rem)] lg:flex-row">
      <DeviceList
        peers={peers}
        localId={deviceId}
        localName={deviceName}
        connectedPeers={connectedPeers}
        pairedPeerIds={pairedPeerIds}
        selectedPeerId={selectedPeerId}
        onSelectPeer={onSelectPeer}
        onConnect={onConnect}
      />

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PairingPanel
          phase={pairingPhase}
          code={pairingCode}
          error={pairingError}
          onStartHost={onStartPairingHost}
          onCancelHost={onCancelPairingHost}
          onVerify={onVerifyPairingCode}
          onDismissSuccess={onDismissPairingSuccess}
          disabled={pairingDisabled}
        />
        <RecipientBar
          selectedPeerName={selectedPeerName}
          peerCount={otherPeerCount}
          onClearSelection={onClearSelection}
          disabled={shareDisabled}
        />
        <DropZone onFiles={onFiles} disabled={shareDisabled} />
        <ChatPanel
          messages={messages}
          localName={deviceName}
          selectedPeerName={selectedPeerName}
          onSendText={onSendText}
          onSendLink={onSendLink}
          disabled={shareDisabled}
        />
      </section>

      <TransferPanel
        transfers={transfers}
        onCancel={onCancel}
        onRetry={onRetry}
        className="hidden lg:flex"
      />
    </AppShell>
  );
}

export function ShareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileTab, setMobileTab] = useState<MobileTab>("share");

  const {
    peers,
    transfers,
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
    ready,
    connectToPeer,
    startPairingHost,
    cancelPairingHost,
    verifyPairingCode,
    resetPairingUi,
    sendFiles,
    messages,
    sendText,
    sendLink,
    rename,
    acceptTransfer,
    rejectTransfer,
    cancelTransfer,
    retryTransfer,
  } = usePeerBeam();

  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

  useEffect(() => {
    const pair = searchParams.get("pair");
    if (pair) setSelectedPeerId(pair);
  }, [searchParams]);

  useEffect(() => {
    if (lastPairedPeerId) {
      setSelectedPeerId(lastPairedPeerId);
      setMobileTab("share");
    }
  }, [lastPairedPeerId]);

  const selectedPeer = peers.find((p) => p.id === selectedPeerId);
  const otherPeerCount = peers.filter((p) => p.id !== deviceId).length;
  const pendingIncoming = useMemo(
    () =>
      transfers.find(
        (t) => t.direction === "incoming" && t.status === "awaiting-accept"
      ) ?? null,
    [transfers]
  );

  const handlePair = useCallback(
    (payload: PairingPayload) => {
      if (payload.room !== roomId) {
        router.push(
          `/share?room=${encodeURIComponent(payload.room)}&pair=${payload.deviceId}`
        );
        return;
      }
      setSelectedPeerId(payload.deviceId);
      void connectToPeer(payload.deviceId);
    },
    [roomId, router, connectToPeer]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      void sendFiles(files, selectedPeerId ?? undefined);
      setMobileTab("transfers");
    },
    [sendFiles, selectedPeerId]
  );

  const visibleMessages = useMemo(
    () => filterMessagesForPeer(messages, selectedPeerId),
    [messages, selectedPeerId]
  );

  const workspaceProps = {
    peers,
    deviceId,
    deviceName,
    connectedPeers,
    pairedPeerIds,
    selectedPeerId,
    onSelectPeer: setSelectedPeerId,
    onConnect: (id: string) => void connectToPeer(id),
    selectedPeerName: selectedPeer?.name ?? null,
    otherPeerCount,
    ready,
    hasPairedConnection,
    pairingPhase,
    pairingCode,
    pairingError,
    onStartPairingHost: startPairingHost,
    onCancelPairingHost: cancelPairingHost,
    onVerifyPairingCode: verifyPairingCode,
    onDismissPairingSuccess: resetPairingUi,
    transfers,
    messages: visibleMessages,
    onFiles: handleFiles,
    onSendText: (t: string) => sendText(t, selectedPeerId ?? undefined),
    onSendLink: (u: string) => sendLink(u, selectedPeerId ?? undefined),
    onCancel: cancelTransfer,
    onRetry: retryTransfer,
    onClearSelection: () => setSelectedPeerId(null),
  };

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <MeshBackground />
      <AppHeader
        deviceName={deviceName}
        roomId={roomId}
        deviceId={deviceId}
        ready={ready}
        onRename={rename}
        onPair={handlePair}
      />

      <div className="mx-auto hidden w-full max-w-6xl flex-1 px-4 pb-6 pt-4 lg:block">
        <ShareWorkspace {...workspaceProps} />
      </div>

      <main className="flex flex-1 flex-col pb-[4.5rem] lg:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as MobileTab)}
          className="flex flex-1 flex-col"
        >
          <div className="flex-1 px-3 pt-3">
            <TabsContent value="devices" className="mt-0 h-full">
              <AppShell className="min-h-[calc(100vh-11rem)]">
                <DeviceList
                  peers={peers}
                  localId={deviceId}
                  localName={deviceName}
                  connectedPeers={connectedPeers}
                  pairedPeerIds={pairedPeerIds}
                  selectedPeerId={selectedPeerId}
                  onSelectPeer={setSelectedPeerId}
                  onConnect={(id) => void connectToPeer(id)}
                />
              </AppShell>
            </TabsContent>
            <TabsContent value="share" className="mt-0">
              <AppShell className="min-h-[calc(100vh-11rem)] flex-col">
                <PairingPanel
                  phase={pairingPhase}
                  code={pairingCode}
                  error={pairingError}
                  onStartHost={startPairingHost}
                  onCancelHost={cancelPairingHost}
                  onVerify={verifyPairingCode}
                  onDismissSuccess={resetPairingUi}
                  disabled={!ready}
                  className="px-0"
                />
                <RecipientBar
                  selectedPeerName={selectedPeer?.name ?? null}
                  peerCount={otherPeerCount}
                  onClearSelection={() => setSelectedPeerId(null)}
                  disabled={!ready || otherPeerCount === 0 || !hasPairedConnection}
                />
                <DropZone
                  onFiles={handleFiles}
                  disabled={!ready || otherPeerCount === 0 || !hasPairedConnection}
                />
                <ChatPanel
                  messages={visibleMessages}
                  localName={deviceName}
                  selectedPeerName={selectedPeer?.name ?? null}
                  onSendText={(t) => sendText(t, selectedPeerId ?? undefined)}
                  onSendLink={(u) => sendLink(u, selectedPeerId ?? undefined)}
                  disabled={!ready || otherPeerCount === 0 || !hasPairedConnection}
                />
              </AppShell>
            </TabsContent>
            <TabsContent value="transfers" className="mt-0">
              <AppShell className="min-h-[calc(100vh-11rem)] flex-col">
                <TransferPanel
                  transfers={transfers}
                  onCancel={cancelTransfer}
                  onRetry={retryTransfer}
                  className="flex flex-1 border-l-0"
                />
              </AppShell>
            </TabsContent>
          </div>

          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
            <TabsList className="grid h-11 w-full grid-cols-3 rounded-2xl bg-muted/60 p-1">
              <TabsTrigger value="devices" className="gap-1 rounded-xl text-[11px]">
                <Users className="h-4 w-4" />
                Peers
              </TabsTrigger>
              <TabsTrigger value="share" className="gap-1 rounded-xl text-[11px]">
                <Share2 className="h-4 w-4" />
                Beam
              </TabsTrigger>
              <TabsTrigger value="transfers" className="relative gap-1 rounded-xl text-[11px]">
                <Activity className="h-4 w-4" />
                Activity
                {transfers.some(
                  (t) => t.status === "transferring" || t.status === "awaiting-accept"
                ) && (
                  <span className="absolute right-3 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </TabsTrigger>
            </TabsList>
          </nav>
        </Tabs>
      </main>

      <TransferDialog
        transfer={pendingIncoming}
        onAccept={acceptTransfer}
        onReject={rejectTransfer}
      />
    </div>
  );
}
