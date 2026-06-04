"use client";

import { QrCode, ScanLine, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { PairingPayload } from "@/types";

interface QrPairingProps {
  roomId: string;
  deviceId: string;
  onPair: (payload: PairingPayload) => void;
}

export function QrPairing({ roomId, deviceId, onPair }: QrPairingProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void>; isScanning: boolean } | null>(null);
  const scanRegionId = "peer-beam-qr-scanner";

  useEffect(() => {
    if (!deviceId) return;
    const pairingUrl = `${window.location.origin}/share?room=${encodeURIComponent(roomId)}&pair=${deviceId}`;
    void import("qrcode").then((QRCode) =>
      QRCode.toDataURL(pairingUrl, { margin: 2, width: 220 }).then(setQrDataUrl)
    );
  }, [roomId, deviceId]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    scannerRef.current = null;
  }, []);

  useEffect(() => {
    if (!scanOpen) {
      void stopScanner();
      return;
    }

    let cancelled = false;

    void import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(scanRegionId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            try {
              const url = new URL(decoded);
              const room = url.searchParams.get("room");
              const pair = url.searchParams.get("pair");
              if (room && pair) {
                onPair({ room, deviceId: pair, origin: url.origin });
                setScanOpen(false);
              }
            } catch {
              /* not a valid pairing URL */
            }
          },
          () => {}
        )
        .catch(() => {
          setScanOpen(false);
        });
    });

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [scanOpen, onPair, stopScanner]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="mr-2 h-4 w-4" />
          QR Pair
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Pair via QR</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col items-center gap-6">
          <div className="rounded-2xl border bg-white p-4 dark:bg-zinc-900">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Pairing QR code" width={220} height={220} />
            ) : (
              <div className="h-[220px] w-[220px] animate-pulse rounded bg-muted" />
            )}
          </div>
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            Scan this code on another device to join room{" "}
            <span className="font-mono text-foreground">{roomId}</span>
          </p>
          <Button variant="secondary" onClick={() => setScanOpen(true)}>
            <ScanLine className="mr-2 h-4 w-4" />
            Scan QR Code
          </Button>
        </div>
        <Dialog open={scanOpen} onOpenChange={setScanOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>Point your camera at a Peer Beam QR code</DialogDescription>
            </DialogHeader>
            <div id={scanRegionId} className="min-h-[280px] w-full overflow-hidden rounded-lg" />
            <Button variant="ghost" onClick={() => setScanOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
