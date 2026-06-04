"use client";

import { FolderOpen, ImageIcon, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFiles: (files: FileList | File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFiles, disabled }: DropZoneProps) {
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
    <div className="flex flex-1 flex-col p-5">
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
          "relative flex min-h-[340px] flex-1 cursor-pointer flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl transition-all duration-300",
          dragOver
            ? "bg-gradient-to-b from-primary/15 to-cyan-500/10 ring-2 ring-primary ring-offset-2 ring-offset-card"
            : "bg-gradient-to-b from-muted/30 to-muted/10 hover:from-muted/40 hover:to-muted/20",
          disabled && "cursor-not-allowed opacity-40"
        )}
      >
        <div
          className={cn(
            "flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-background shadow-lg transition-transform duration-300",
            dragOver && "scale-105"
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <Upload className="h-8 w-8" strokeWidth={2} />
          </div>
        </div>

        <div className="max-w-sm text-center">
          <p className="text-xl font-semibold tracking-tight">
            {dragOver ? "Drop to beam" : "Drop files to beam"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Photos, videos, documents, or entire folders — encrypted peer-to-peer.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          <span>Any file type</span>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Button
          type="button"
          size="lg"
          className="h-12 flex-1 rounded-2xl text-base font-medium shadow-lg shadow-primary/20"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <Upload className="mr-2 h-5 w-5" />
          Choose files
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 rounded-2xl px-6"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            folderRef.current?.click();
          }}
        >
          <FolderOpen className="mr-2 h-5 w-5" />
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
    </div>
  );
}
