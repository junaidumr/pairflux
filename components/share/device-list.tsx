"use client";

import { Check, Lock, ShieldCheck, Users, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getAvatarColor } from "@/lib/device";
import { cn } from "@/lib/utils";
import type { PeerDevice } from "@/types";

interface DeviceListProps {
  peers: PeerDevice[];
  localId: string;
  localName: string;
  connectedPeers: Set<string>;
  pairedPeerIds: Set<string>;
  selectedPeerId: string | null;
  onSelectPeer: (id: string | null) => void;
  onConnect: (id: string) => void;
  className?: string;
}

export function DeviceList({
  peers,
  localId,
  localName,
  connectedPeers,
  pairedPeerIds,
  selectedPeerId,
  onSelectPeer,
  onConnect,
  className,
}: DeviceListProps) {
  const others = peers.filter((p) => p.id !== localId);

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r border-border/40 bg-muted/15 lg:w-[280px] lg:shrink-0",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Users className="h-4 w-4 text-primary" />
          Nearby
        </h2>
        <Badge variant="outline" className="h-6 rounded-md px-2 font-mono text-[11px]">
          {others.length}
        </Badge>
      </div>

      <div className="px-3 pb-3">
        <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-3 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-primary/80">
            This device
          </p>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl text-base font-bold text-white shadow-md",
                getAvatarColor(localId)
              )}
            >
              {localName.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{localName}</p>
              <p className="text-xs text-muted-foreground">You</p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-border/40" />

      <ScrollArea className="min-h-0 flex-1 px-3 py-3">
        {others.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
              <WifiOff className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium">Waiting for peers</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Open this room on another browser to start sharing.
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Peers
            </p>
            {others.map((peer) => {
              const connected = connectedPeers.has(peer.id);
              const paired = pairedPeerIds.has(peer.id);
              const selected = selectedPeerId === peer.id;
              return (
                <li key={peer.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = selected ? null : peer.id;
                      onSelectPeer(next);
                      if (next && paired && !connected) void onConnect(peer.id);
                    }}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all",
                      selected
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "hover:bg-muted/60"
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white",
                        getAvatarColor(peer.id),
                        selected && "ring-2 ring-primary-foreground/30"
                      )}
                    >
                      {peer.name.charAt(0)}
                      {connected && (
                        <span
                          className={cn(
                            "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500",
                            selected ? "ring-2 ring-primary" : "ring-2 ring-card"
                          )}
                        >
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{peer.name}</p>
                      <p
                        className={cn(
                          "text-xs",
                          selected ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {connected
                          ? "Ready"
                          : paired
                            ? "Connecting…"
                            : "Needs pairing code"}
                      </p>
                    </div>
                    {paired ? (
                      <ShieldCheck
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selected ? "text-primary-foreground" : "text-emerald-500"
                        )}
                      />
                    ) : (
                      <Lock
                        className={cn(
                          "h-4 w-4 shrink-0 opacity-50",
                          selected ? "text-primary-foreground" : "text-muted-foreground"
                        )}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
}
