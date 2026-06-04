"use client";

import { tlog } from "@/lib/transfer-debug";

const STREAMING_THRESHOLD = 64 * 1024 * 1024;

export interface ReceiveSink {
  write(chunk: ArrayBuffer): Promise<void>;
  finalize(): Promise<void>;
  abort(): Promise<void>;
}

class MemoryReceiveSink implements ReceiveSink {
  private parts: BlobPart[] = [];

  async write(chunk: ArrayBuffer): Promise<void> {
    this.parts.push(chunk);
  }

  async finalize(): Promise<void> {
    /* download triggered by TransferEngine with collected parts */
  }

  getParts(): BlobPart[] {
    return this.parts;
  }

  async abort(): Promise<void> {
    this.parts = [];
  }
}

class DiskReceiveSink implements ReceiveSink {
  private writable: FileSystemWritableFileStream;
  private written = 0;

  constructor(writable: FileSystemWritableFileStream) {
    this.writable = writable;
  }

  async write(chunk: ArrayBuffer): Promise<void> {
    await this.writable.write(chunk);
    this.written += chunk.byteLength;
  }

  async finalize(): Promise<void> {
    await this.writable.close();
    tlog("disk receive complete", this.written);
  }

  async abort(): Promise<void> {
    try {
      await this.writable.abort();
    } catch {
      /* ignore */
    }
  }
}

export type ReceiveSinkHandle =
  | { mode: "memory"; sink: MemoryReceiveSink }
  | { mode: "disk"; sink: DiskReceiveSink };

export async function createMemorySink(): Promise<ReceiveSinkHandle> {
  return { mode: "memory", sink: new MemoryReceiveSink() };
}

export async function createReceiveSink(
  fileName: string,
  fileSize: number
): Promise<ReceiveSinkHandle> {
  if (
    fileSize >= STREAMING_THRESHOLD &&
    typeof window !== "undefined" &&
    "showSaveFilePicker" in window
  ) {
    try {
      const handle = await (
        window as Window & {
          showSaveFilePicker: (o: { suggestedName: string }) => Promise<FileSystemFileHandle>;
        }
      ).showSaveFilePicker({ suggestedName: fileName });
      const writable = await handle.createWritable();
      tlog("using disk streaming sink", fileName, fileSize);
      return { mode: "disk", sink: new DiskReceiveSink(writable) };
    } catch {
      tlog("save picker declined, falling back to memory");
    }
  }

  return { mode: "memory", sink: new MemoryReceiveSink() };
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
