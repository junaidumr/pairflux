"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/share/app-header";
import { DeviceList } from "@/components/share/device-list";
import { DropZone } from "@/components/share/drop-zone";
import { TextShare } from "@/components/share/text-share";
import { TransferDialog } from "@/components/share/transfer-dialog";
import { TransferPanel } from "@/components/share/transfer-panel";
import { usePeerBeam } from "@/hooks/use-peer-beam";
import type { PairingPayload } from "@/types";

export function ShareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    peers,
    transfers,
    connectedPeers,
    initialized,
    deviceId,
    deviceName,
    roomId,
    ready,
    connectToPeer,
    sendFiles,
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
    if (pair) {
      void connectToPeer(pair);
      setSelectedPeerId(pair);
    }
  }, [searchParams, connectToPeer]);

  const selectedPeer = peers.find((p) => p.id === selectedPeerId);
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
      void connectToPeer(payload.deviceId);
      setSelectedPeerId(payload.deviceId);
    },
    [roomId, router, connectToPeer]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      void sendFiles(files, selectedPeerId ?? undefined);
    },
    [sendFiles, selectedPeerId]
  );

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Connecting…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/30">
      <AppHeader
        deviceName={deviceName}
        roomId={roomId}
        deviceId={deviceId}
        ready={ready}
        onRename={rename}
        onPair={handlePair}
      />
      <main className="mx-auto grid w-full max-w-[1600px] flex-1 gap-4 p-4 lg:grid-cols-[280px_1fr_300px]">
        <aside className="min-h-[320px] lg:min-h-0">
          <DeviceList
            peers={peers}
            localId={deviceId}
            localName={deviceName}
            connectedPeers={connectedPeers}
            selectedPeerId={selectedPeerId}
            onSelectPeer={setSelectedPeerId}
            onConnect={connectToPeer}
          />
        </aside>
        <section className="flex min-h-0 flex-col gap-4">
          <DropZone
            onFiles={handleFiles}
            disabled={!ready || peers.filter((p) => p.id !== deviceId).length === 0}
            selectedPeerName={selectedPeer?.name ?? null}
          />
          <div className="rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm">
            <TextShare
              onSendText={(t) => sendText(t, selectedPeerId ?? undefined)}
              onSendLink={(u) => sendLink(u, selectedPeerId ?? undefined)}
              disabled={!ready}
            />
          </div>
        </section>
        <aside className="min-h-[320px] lg:min-h-0">
          <TransferPanel
            transfers={transfers}
            onCancel={cancelTransfer}
            onRetry={retryTransfer}
          />
        </aside>
      </main>
      <TransferDialog
        transfer={pendingIncoming}
        onAccept={acceptTransfer}
        onReject={rejectTransfer}
      />
    </div>
  );
}
