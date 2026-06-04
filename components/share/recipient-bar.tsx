"use client";

import { Radio, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RecipientBarProps {
  selectedPeerName: string | null;
  peerCount: number;
  onClearSelection: () => void;
  disabled?: boolean;
}

export function RecipientBar({
  selectedPeerName,
  peerCount,
  onClearSelection,
  disabled,
}: RecipientBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-5 py-3.5">
      <div className="flex items-center gap-2">
        {selectedPeerName ? (
          <>
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Sending to</span>
            <Badge className="rounded-lg bg-primary/15 px-2.5 py-1 text-primary hover:bg-primary/15">
              {selectedPeerName}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg text-xs text-muted-foreground"
              disabled={disabled}
              onClick={onClearSelection}
            >
              Send to all
            </Button>
          </>
        ) : (
          <>
            <Radio className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Broadcast to all peers</span>
            <Badge variant="secondary" className="rounded-md text-xs">
              {peerCount} online
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}
