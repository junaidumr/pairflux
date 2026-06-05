"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Film,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { canImportToGallery, importToGalleryHint } from "@/lib/file-export";
import { isIOS } from "@/lib/platform";
import { cn } from "@/lib/utils";
import type { FileCategory, ReceivedFilePayload } from "@/types";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function categoryIcon(category: FileCategory) {
  if (category === "image") return ImageIcon;
  if (category === "video") return Film;
  return FileText;
}

function categoryLabel(category: FileCategory): string {
  if (category === "image") return "Image";
  if (category === "video") return "Video";
  return "Document";
}

interface FileReceivedDialogProps {
  file: ReceivedFilePayload | null;
  onDismiss: () => void;
  onOpen: () => void | Promise<void>;
  onDownload: () => void | Promise<void>;
  onImport: () => void | Promise<void>;
}

function FileReceivedContent({
  file,
  onOpen,
  onDownload,
  onImport,
  importing,
  setImporting,
}: {
  file: ReceivedFilePayload;
  onOpen: () => void | Promise<void>;
  onDownload: () => void | Promise<void>;
  onImport: () => void | Promise<void>;
  importing: boolean;
  setImporting: (v: boolean) => void;
}) {
  const Icon = categoryIcon(file.fileCategory);
  const showImport =
    file.blob !== null && canImportToGallery(file.mimeType, file.fileName);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{file.fileName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatBytes(file.fileSize)} · from {file.peerName}
          </p>
          <Badge variant="outline" className="mt-2 capitalize">
            {categoryLabel(file.fileCategory)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <Button
          className="min-h-12 w-full rounded-xl text-base"
          variant="outline"
          onClick={() => void onOpen()}
          disabled={!file.blob}
        >
          <ExternalLink className="mr-2 h-5 w-5" />
          Open File
        </Button>
        <Button
          className="min-h-12 w-full rounded-xl text-base"
          variant="outline"
          onClick={() => void onDownload()}
          disabled={!file.blob}
        >
          <Download className="mr-2 h-5 w-5" />
          Download Again
        </Button>
        {showImport && (
          <Button
            className={cn(
              "min-h-12 w-full rounded-xl text-base shadow-lg shadow-emerald-500/20",
              "bg-emerald-600 text-white hover:bg-emerald-600/90"
            )}
            onClick={async () => {
              setImporting(true);
              try {
                await onImport();
              } finally {
                setImporting(false);
              }
            }}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ImageIcon className="mr-2 h-5 w-5" />
            )}
            Import to Gallery
          </Button>
        )}
      </div>

      {showImport && isIOS() && (
        <p className="text-center text-xs text-muted-foreground">{importToGalleryHint()}</p>
      )}

      {!file.blob && (
        <p className="text-center text-xs text-muted-foreground">
          This file was saved directly to your device during transfer.
        </p>
      )}
    </div>
  );
}

export function FileReceivedDialog({
  file,
  onDismiss,
  onOpen,
  onDownload,
  onImport,
}: FileReceivedDialogProps) {
  const [importing, setImporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const open = !!file;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const content = file ? (
    <FileReceivedContent
      file={file}
      onOpen={onOpen}
      onDownload={onDownload}
      onImport={onImport}
      importing={importing}
      setImporting={setImporting}
    />
  ) : null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onDismiss()}>
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] overflow-y-auto rounded-t-3xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2"
        >
          <SheetHeader className="pb-4 text-left">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              File Received Successfully
            </SheetTitle>
            <SheetDescription>Your file is ready. Save it or import to gallery.</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDismiss()}>
      <DialogContent className="overflow-hidden rounded-2xl border-border/60 p-0 sm:max-w-md">
        <div className="bg-gradient-to-br from-emerald-500/10 via-transparent to-primary/5 px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              File Received Successfully
            </DialogTitle>
            <DialogDescription>Your file is ready. Save it or import to gallery.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 pb-6">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
