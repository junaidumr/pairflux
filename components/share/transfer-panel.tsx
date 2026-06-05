"use client";

import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  Film,
  ImageIcon,
  Inbox,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { canImportToGallery } from "@/lib/file-export";
import { cn } from "@/lib/utils";
import type { FileCategory, HistoryStatus, TransferHistoryRecord, TransferItem } from "@/types";

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

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

function categoryIcon(category: FileCategory) {
  if (category === "image") return ImageIcon;
  if (category === "video") return Film;
  return FileText;
}

function statusBadgeClass(status: HistoryStatus | TransferItem["status"]): string {
  if (status === "sent" || status === "received" || status === "completed") {
    return "border-emerald-500/30 text-emerald-600";
  }
  if (status === "failed") return "border-destructive/30 text-destructive";
  return "";
}

function statusLabel(status: HistoryStatus | TransferItem["status"]): string {
  if (status === "completed") return "done";
  return status.replace("-", " ");
}

type HistoryTab = "all" | "sent" | "received" | "failed";

function filterHistory(records: TransferHistoryRecord[], tab: HistoryTab): TransferHistoryRecord[] {
  switch (tab) {
    case "sent":
      return records.filter((r) => r.status === "sent");
    case "received":
      return records.filter((r) => r.status === "received");
    case "failed":
      return records.filter((r) => r.status === "failed");
    default:
      return records;
  }
}

function ActiveTransferCard({
  transfer,
  onCancel,
  onRetry,
}: {
  transfer: TransferItem;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const isIn = transfer.direction === "incoming";
  const Icon = isIn ? ArrowDown : ArrowUp;

  return (
    <Card className="overflow-hidden border-border/50 bg-card/80 py-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-start gap-2.5 p-3">
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              isIn ? "bg-emerald-500/15 text-emerald-600" : "bg-indigo-500/15 text-indigo-600"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-xs font-medium leading-snug">{transfer.fileName}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {transfer.peerName} · {formatBytes(transfer.fileSize)}
            </p>
          </div>
        </div>

        {(transfer.status === "transferring" || transfer.status === "awaiting-accept") && (
          <div className="space-y-1.5 border-t border-border/40 bg-muted/20 px-3 py-2.5">
            <Progress value={transfer.progress} className="h-1" />
            {transfer.status === "transferring" && (
              <p className="text-[10px] text-muted-foreground">
                {Math.round(transfer.progress)}% · {formatBytes(transfer.speedBps)}/s ·{" "}
                {formatEta(transfer.etaSeconds)}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
          <Badge
            variant="outline"
            className={cn("h-5 rounded-md px-1.5 text-[10px] capitalize", statusBadgeClass(transfer.status))}
          >
            {statusLabel(transfer.status)}
          </Badge>
          <div className="flex gap-0.5">
            {(transfer.status === "transferring" || transfer.status === "awaiting-accept") && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onCancel(transfer.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            {transfer.status === "failed" && !isIn && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onRetry(transfer.id)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {transfer.error && (
          <p className="border-t border-destructive/20 bg-destructive/5 px-3 py-1.5 text-[10px] text-destructive">
            {transfer.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryRecordCard({
  record,
  onDownload,
  onImport,
  onDelete,
}: {
  record: TransferHistoryRecord;
  onDownload: (record: TransferHistoryRecord) => void;
  onImport: (record: TransferHistoryRecord) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = categoryIcon(record.fileCategory);
  const showImport =
    record.hasBlob && canImportToGallery(record.mimeType, record.fileName);
  const peerLabel =
    record.direction === "incoming" ? `From: ${record.peerName}` : `To: ${record.peerName}`;

  return (
    <Card className="overflow-hidden border-border/50 bg-card/80 py-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-start gap-3 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{record.fileName}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {formatBytes(record.fileSize)} · {formatRelativeTime(record.timestamp)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn("h-5 rounded-md px-1.5 text-[10px] capitalize", statusBadgeClass(record.status))}
              >
                {record.status}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{peerLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/40 bg-muted/10 px-3 py-2.5 sm:flex-row">
          {record.hasBlob && (
            <Button
              size="sm"
              variant="outline"
              className="min-h-10 flex-1 rounded-xl"
              onClick={() => onDownload(record)}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </Button>
          )}
          {showImport && (
            <Button
              size="sm"
              className="min-h-10 flex-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-600/90"
              onClick={() => onImport(record)}
            >
              <ImageIcon className="mr-1.5 h-4 w-4" />
              Import
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="min-h-10 rounded-xl text-muted-foreground sm:w-auto"
            onClick={() => onDelete(record.id)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface TransferPanelProps {
  transfers: TransferItem[];
  history: TransferHistoryRecord[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onDownloadHistory: (record: TransferHistoryRecord) => void;
  onImportHistory: (record: TransferHistoryRecord) => void;
  onDeleteHistory: (id: string) => void;
  className?: string;
}

export function TransferPanel({
  transfers,
  history,
  onCancel,
  onRetry,
  onDownloadHistory,
  onImportHistory,
  onDeleteHistory,
  className,
}: TransferPanelProps) {
  const active = transfers.filter(
    (t) => t.status === "transferring" || t.status === "awaiting-accept"
  );
  const activeIds = new Set(transfers.map((t) => t.id));
  const historyOnly = history.filter((r) => !activeIds.has(r.id));

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-l border-border/40 bg-muted/10 lg:w-[340px] lg:shrink-0",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-4">
        <h2 className="text-sm font-semibold tracking-tight">History</h2>
        {active.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
            {active.length}
          </span>
        )}
      </div>

      <Tabs defaultValue="all" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border/40 px-3 py-2">
          <TabsList className="grid h-9 w-full grid-cols-4 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="all" className="rounded-lg text-[10px]">
              All
            </TabsTrigger>
            <TabsTrigger value="sent" className="rounded-lg text-[10px]">
              Sent
            </TabsTrigger>
            <TabsTrigger value="received" className="rounded-lg text-[10px]">
              Received
            </TabsTrigger>
            <TabsTrigger value="failed" className="rounded-lg text-[10px]">
              Failed
            </TabsTrigger>
          </TabsList>
        </div>

        {(["all", "sent", "received", "failed"] as HistoryTab[]).map((tab) => {
          const filtered = filterHistory(historyOnly, tab);
          const failedActive =
            tab === "failed"
              ? transfers.filter((t) => t.status === "failed" && !historyOnly.some((r) => r.id === t.id))
              : [];
          const isEmpty = active.length === 0 && filtered.length === 0 && failedActive.length === 0;

          return (
            <TabsContent key={tab} value={tab} className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden">
              <ScrollArea className="h-full px-3 py-3">
                {isEmpty ? (
                  <div className="flex flex-col items-center gap-3 px-2 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                      <Inbox className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium">No transfers yet</p>
                    <p className="text-xs text-muted-foreground">
                      Completed transfers appear here with download and gallery import.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {active.length > 0 && tab === "all" && (
                      <>
                        <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Active
                        </p>
                        {active.map((t) => (
                          <ActiveTransferCard
                            key={t.id}
                            transfer={t}
                            onCancel={onCancel}
                            onRetry={onRetry}
                          />
                        ))}
                        {filtered.length > 0 && (
                          <p className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Past
                          </p>
                        )}
                      </>
                    )}
                    {failedActive.map((t) => (
                      <ActiveTransferCard
                        key={t.id}
                        transfer={t}
                        onCancel={onCancel}
                        onRetry={onRetry}
                      />
                    ))}
                    {filtered.map((record) => (
                      <HistoryRecordCard
                        key={record.id}
                        record={record}
                        onDownload={onDownloadHistory}
                        onImport={onImportHistory}
                        onDelete={onDeleteHistory}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          );
        })}
      </Tabs>
    </aside>
  );
}
