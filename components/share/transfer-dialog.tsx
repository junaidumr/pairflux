"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Incoming file</DialogTitle>
          <DialogDescription>
            {transfer?.peerName} wants to send you a file
          </DialogDescription>
        </DialogHeader>
        {transfer && (
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="font-medium">{transfer.fileName}</p>
            <p className="text-sm text-muted-foreground">{formatBytes(transfer.fileSize)}</p>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => transfer && onReject(transfer.id)}>
            Reject
          </Button>
          <Button onClick={() => transfer && onAccept(transfer.id)}>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
