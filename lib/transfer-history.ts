"use client";

import type { TransferHistoryRecord } from "@/types";

const STORAGE_KEY = "pairflux-transfer-history";
const MAX_RECORDS = 200;

function readAll(): TransferHistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TransferHistoryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: TransferHistoryRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function loadHistory(): TransferHistoryRecord[] {
  return readAll().sort((a, b) => b.timestamp - a.timestamp);
}

export function upsertRecord(record: TransferHistoryRecord): TransferHistoryRecord[] {
  const all = readAll();
  const idx = all.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...record };
  } else {
    all.unshift(record);
  }
  const trimmed = all
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_RECORDS);
  writeAll(trimmed);
  return trimmed;
}

export function deleteRecord(id: string): TransferHistoryRecord[] {
  const next = readAll().filter((r) => r.id !== id);
  writeAll(next);
  return next;
}

export function clearHistory(): void {
  writeAll([]);
}
