"use client";

import { ArrowDown, ArrowUp, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TransferItem } from "@/types";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatEta(sec: number | null): string {
  if (sec == null || !Number.isFinite(sec)) return "—";
  if (sec < 60) return `${Math.ceil(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.ceil(sec % 60)}s`;
}

interface TransferPanelProps {
  transfers: TransferItem[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
}

export function TransferPanel({ transfers, onCancel, onRetry }: TransferPanelProps) {
  return (
    <Card className="flex h-full flex-col border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Transfers</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <ScrollArea className="h-[calc(100vh-180px)] min-h-[320px] px-4 pb-4">
          {transfers.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No active transfers
            </p>
          ) : (
            <ul className="space-y-3">
              {transfers.map((t) => (
                <li
                  key={t.id}
                  className="rounded-xl border border-border/60 bg-muted/30 p-3"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {t.direction === "incoming" ? (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <ArrowUp className="h-3.5 w-3.5 text-blue-500" />
                        )}
                        <p className="truncate text-sm font-medium">{t.fileName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t.peerName} · {formatBytes(t.fileSize)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        t.status === "completed"
                          ? "default"
                          : t.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {t.status}
                    </Badge>
                  </div>
                  {(t.status === "transferring" || t.status === "awaiting-accept") && (
                    <>
                      <Progress value={t.progress} className="h-2" />
                      {t.status === "transferring" && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatBytes(t.speedBps)}/s · ETA {formatEta(t.etaSeconds)}
                        </p>
                      )}
                    </>
                  )}
                  <div className="mt-2 flex gap-1">
                    {(t.status === "transferring" || t.status === "awaiting-accept") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => onCancel(t.id)}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                    )}
                    {t.status === "failed" && t.direction === "outgoing" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => onRetry(t.id)}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Retry
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
