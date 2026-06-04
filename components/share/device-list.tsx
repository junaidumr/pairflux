"use client";

import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAvatarColor } from "@/lib/device";
import { cn } from "@/lib/utils";
import type { PeerDevice } from "@/types";

interface DeviceListProps {
  peers: PeerDevice[];
  localId: string;
  localName: string;
  connectedPeers: Set<string>;
  selectedPeerId: string | null;
  onSelectPeer: (id: string | null) => void;
  onConnect: (id: string) => void;
}

export function DeviceList({
  peers,
  localId,
  localName,
  connectedPeers,
  selectedPeerId,
  onSelectPeer,
  onConnect,
}: DeviceListProps) {
  const others = peers.filter((p) => p.id !== localId);

  return (
    <Card className="flex h-full flex-col border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Wifi className="h-4 w-4 text-primary" />
          Nearby Devices
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white",
              getAvatarColor(localId)
            )}
          >
            {localName.charAt(0)}
          </span>
          <span>You · {localName}</span>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0 pt-0">
        <ScrollArea className="h-[calc(100vh-220px)] min-h-[280px] px-4 pb-4">
          {others.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <WifiOff className="h-8 w-8 opacity-40" />
              <p>Waiting for peers on this network…</p>
              <p className="text-xs">Open the same room URL on another device.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {others.map((peer) => {
                const connected = connectedPeers.has(peer.id);
                const selected = selectedPeerId === peer.id;
                return (
                  <li key={peer.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPeer(selected ? null : peer.id);
                            if (!connected) onConnect(peer.id);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                            selected
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-transparent bg-muted/40 hover:bg-muted/70"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                              getAvatarColor(peer.id)
                            )}
                          >
                            {peer.name.charAt(0)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{peer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {connected ? "Connected" : "Connecting…"}
                            </p>
                          </div>
                          <Badge variant={connected ? "default" : "secondary"}>
                            {connected ? "Online" : "…"}
                          </Badge>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {connected ? "Send files to this device" : "Establishing WebRTC…"}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
