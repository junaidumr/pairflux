"use client";

import { ArrowDown, ArrowUp, Inbox, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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
  className?: string;
}

export function TransferPanel({ transfers, onCancel, onRetry, className }: TransferPanelProps) {
  const active = transfers.filter(
    (t) => t.status === "transferring" || t.status === "awaiting-accept"
  );

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-l border-border/40 bg-muted/10 lg:w-[300px] lg:shrink-0",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-4">
        <h2 className="text-sm font-semibold tracking-tight">Activity</h2>
        {active.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
            {active.length}
          </span>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 py-3">
        {transfers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-2 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
              <Inbox className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium">No activity</p>
            <p className="text-xs text-muted-foreground">Transfers appear here live.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {transfers.map((t) => {
              const isIn = t.direction === "incoming";
              return (
                <li
                  key={t.id}
                  className="overflow-hidden rounded-2xl border border-border/50 bg-card/80"
                >
                  <div className="flex items-start gap-2.5 p-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        isIn ? "bg-emerald-500/15 text-emerald-600" : "bg-indigo-500/15 text-indigo-600"
                      )}
                    >
                      {isIn ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium leading-snug">
                        {t.fileName}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {t.peerName} · {formatBytes(t.fileSize)}
                      </p>
                    </div>
                  </div>

                  {(t.status === "transferring" || t.status === "awaiting-accept") && (
                    <div className="space-y-1.5 border-t border-border/40 bg-muted/20 px-3 py-2.5">
                      <Progress value={t.progress} className="h-1" />
                      {t.status === "transferring" && (
                        <p className="text-[10px] text-muted-foreground">
                          {Math.round(t.progress)}% · {formatBytes(t.speedBps)}/s · {formatEta(t.etaSeconds)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 rounded-md px-1.5 text-[10px] capitalize",
                        t.status === "completed" && "border-emerald-500/30 text-emerald-600",
                        t.status === "failed" && "border-destructive/30 text-destructive"
                      )}
                    >
                      {t.status.replace("-", " ")}
                    </Badge>
                    <div className="flex gap-0.5">
                      {(t.status === "transferring" || t.status === "awaiting-accept") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onCancel(t.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {t.status === "failed" && !isIn && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onRetry(t.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {t.error && (
                    <p className="border-t border-destructive/20 bg-destructive/5 px-3 py-1.5 text-[10px] text-destructive">
                      {t.error}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
}
