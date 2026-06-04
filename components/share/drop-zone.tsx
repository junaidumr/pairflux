"use client";

import { FolderOpen, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFiles: (files: FileList | File[]) => void;
  disabled?: boolean;
  selectedPeerName?: string | null;
}

export function DropZone({ onFiles, disabled, selectedPeerName }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || !e.dataTransfer.files.length) return;
      onFiles(e.dataTransfer.files);
    },
    [disabled, onFiles]
  );

  return (
    <Card className="flex h-full flex-col border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Share Files</CardTitle>
        <CardDescription>
          {selectedPeerName
            ? `Sending to ${selectedPeerName}`
            : "Drop files to send to all connected peers"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            "flex min-h-[280px] flex-1 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 transition-all",
            dragOver
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Drag & drop files here</p>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to browse · multiple files supported
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            className="flex-1"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Select Files
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => folderRef.current?.click()}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Folder
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={folderRef}
          type="file"
          // @ts-expect-error webkitdirectory is non-standard but widely supported
          webkitdirectory=""
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </CardContent>
    </Card>
  );
}
