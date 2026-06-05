"use client";

import { Copy, QrCode, ScanLine, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { subtleText } from "@/lib/ui-classes";
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
  const scanRegionId = "pairflux-qr-scanner";

  const pairingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share?room=${encodeURIComponent(roomId)}&pair=${deviceId}`
      : "";

  useEffect(() => {
    if (!deviceId || !pairingUrl) return;
    void import("qrcode").then((QRCode) =>
      QRCode.toDataURL(pairingUrl, {
        margin: 2,
        width: 240,
        color: { dark: "#6366f1", light: "#ffffff00" },
      }).then(setQrDataUrl)
    );
  }, [pairingUrl, deviceId]);

  const copyLink = () => {
    void navigator.clipboard.writeText(pairingUrl);
    toast.success("Pairing link copied");
  };

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
              /* invalid */
            }
          },
          () => {}
        )
        .catch(() => setScanOpen(false));
    });

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [scanOpen, onPair, stopScanner]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1.5">
          <QrCode className="h-4 w-4" />
          <span className="hidden sm:inline">Pair</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full border-border/50 bg-background/95 backdrop-blur-2xl sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Pair devices</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col items-center gap-6">
          <div className="rounded-3xl border border-border/60 bg-white/80 p-5 shadow-xl dark:bg-card/80">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Pairing QR code" width={240} height={240} className="rounded-lg" />
            ) : (
              <div className="h-[240px] w-[240px] animate-pulse rounded-lg bg-muted" />
            )}
          </div>
          <div className="text-center">
            <p className={subtleText}>Room</p>
            <p className="mt-1 font-mono text-lg font-semibold">{roomId}</p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Button variant="secondary" className="rounded-xl" onClick={copyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy invite link
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setScanOpen(true)}>
              <ScanLine className="mr-2 h-4 w-4" />
              Scan QR code
            </Button>
          </div>
        </div>
        <Dialog open={scanOpen} onOpenChange={setScanOpen}>
          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Scan QR code</DialogTitle>
              <DialogDescription>Point your camera at another Pairflux QR</DialogDescription>
            </DialogHeader>
            <div
              id={scanRegionId}
              className="min-h-[280px] w-full overflow-hidden rounded-xl border border-border/60"
            />
            <Button variant="ghost" className="rounded-xl" onClick={() => setScanOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
