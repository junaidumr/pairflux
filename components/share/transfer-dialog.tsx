"use client";

import { ArrowDown, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TransferItem } from "@/types";

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface TransferDialogProps {
  transfer: TransferItem | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function TransferDialog({ transfer, onAccept, onReject }: TransferDialogProps) {
  const open = transfer?.status === "awaiting-accept" && transfer.direction === "incoming";

  return (
    <Dialog open={!!open} onOpenChange={() => transfer && onReject(transfer.id)}>
      <DialogContent className="overflow-hidden rounded-2xl border-border/60 p-0 sm:max-w-md">
        <div className="bg-gradient-to-br from-emerald-500/10 via-transparent to-primary/5 px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                <ArrowDown className="h-5 w-5" />
              </span>
              Incoming file
            </DialogTitle>
            <DialogDescription className="text-left">
              <span className="font-medium text-foreground">{transfer?.peerName}</span> wants
              to send you a file
            </DialogDescription>
          </DialogHeader>
        </div>
        {transfer && (
          <div className="mx-6 mb-2 flex items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{transfer.fileName}</p>
              <p className="text-sm text-muted-foreground">{formatBytes(transfer.fileSize)}</p>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 border-t border-border/50 bg-muted/10 px-6 py-4 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => transfer && onReject(transfer.id)}
          >
            Decline
          </Button>
          <Button
            className="flex-1 rounded-xl shadow-lg shadow-primary/20"
            onClick={() => transfer && onAccept(transfer.id)}
          >
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
