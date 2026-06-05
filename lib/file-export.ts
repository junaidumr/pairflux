"use client";

import { canShareFiles, isIOS } from "@/lib/platform";
import type { FileCategory } from "@/types";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/3gpp": ".3gp",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
};

export function getFileCategory(mime: string, name: string): FileCategory {
  const lower = mime.toLowerCase();
  if (lower.startsWith("image/")) return "image";
  if (lower.startsWith("video/")) return "video";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp"].includes(ext)) {
    return "image";
  }
  if (["mp4", "mov", "webm", "3gp", "mkv", "avi"].includes(ext)) return "video";
  return "document";
}

export function canImportToGallery(mime: string, name: string): boolean {
  const cat = getFileCategory(mime, name);
  return cat === "image" || cat === "video";
}

export function normalizeFileName(name: string, mime: string): string {
  const trimmed = name.trim() || "received-file";
  const ext = MIME_EXTENSIONS[mime.toLowerCase()];
  if (!ext) return trimmed;
  const lower = trimmed.toLowerCase();
  if (lower.endsWith(ext)) return trimmed;
  const dotExt = ext.slice(1);
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot > 0) {
    const existing = trimmed.slice(lastDot + 1).toLowerCase();
    if (existing === dotExt || (dotExt === "jpg" && existing === "jpeg")) {
      return trimmed;
    }
  }
  return `${trimmed}${ext}`;
}

export function blobToFile(blob: Blob, name: string, mime: string): File {
  const normalized = normalizeFileName(name, mime);
  const type = mime || blob.type || "application/octet-stream";
  return new File([blob], normalized, { type, lastModified: Date.now() });
}

export function downloadFile(blob: Blob, name: string, mime: string): void {
  const normalized = normalizeFileName(name, mime);
  const typed =
    blob.type === mime || !mime
      ? blob
      : new Blob([blob], { type: mime || blob.type || "application/octet-stream" });
  const url = URL.createObjectURL(typed);
  const a = document.createElement("a");
  a.href = url;
  a.download = normalized;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openFile(blob: Blob, name: string, mime: string): void {
  const typed =
    blob.type === mime || !mime
      ? blob
      : new Blob([blob], { type: mime || blob.type || "application/octet-stream" });
  const url = URL.createObjectURL(typed);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    downloadFile(blob, name, mime);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export type ImportResult = "shared" | "downloaded" | "cancelled";

export async function importToGallery(
  blob: Blob,
  name: string,
  mime: string
): Promise<ImportResult> {
  const file = blobToFile(blob, name, mime);

  if (canShareFiles() && navigator.share) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  downloadFile(blob, name, mime);
  return "downloaded";
}

export function importToGalleryHint(): string {
  if (isIOS()) {
    return "Tap Save Image or Save Video in the share sheet to add it to Photos.";
  }
  return "Choose Save to Gallery or Photos from the share sheet.";
}
