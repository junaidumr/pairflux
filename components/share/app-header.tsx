"use client";

import { Copy, Hash } from "lucide-react";
import { toast } from "sonner";
import { PairfluxLogo } from "@/components/brand/pairflux-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { QrPairing } from "@/components/share/qr-pairing";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PairingPayload } from "@/types";

interface AppHeaderProps {
  deviceName: string;
  roomId: string;
  deviceId: string;
  ready: boolean;
  onRename: (name: string) => void;
  onPair: (payload: PairingPayload) => void;
}

export function AppHeader({
  deviceName,
  roomId,
  deviceId,
  ready,
  onRename,
  onPair,
}: AppHeaderProps) {
  const copyRoom = () => {
    const url = `${window.location.origin}/share?room=${encodeURIComponent(roomId)}`;
    void navigator.clipboard.writeText(url);
    toast.success("Room link copied");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <PairfluxLogo href="/" size="sm" />

        <button
          type="button"
          onClick={copyRoom}
          className="hidden items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/70 sm:flex"
        >
          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono">{roomId}</span>
          <Copy className="h-3 w-3 opacity-40" />
          <Badge
            variant="outline"
            className={cn(
              "ml-1 h-5 rounded-full border-0 px-2 text-[10px]",
              ready
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-600"
            )}
          >
            {ready ? "Live" : "Offline"}
          </Badge>
        </button>

        <div className="flex items-center gap-1.5">
          <Input
            className="hidden h-8 w-28 rounded-full border-border/50 bg-muted/30 text-xs md:block lg:w-32"
            defaultValue={deviceName}
            onBlur={(e) => onRename(e.target.value)}
            aria-label="Device name"
          />
          <QrPairing roomId={roomId} deviceId={deviceId} onPair={onPair} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
