#!/usr/bin/env node
/**
 * Warn when dev ports are occupied — usually from a stale `npm run dev` session.
 * Web: 3000, Signaling: 3002 (3001 is reserved for Next.js auto-fallback).
 */
import { execSync } from "node:child_process";

const WEB_PORT = process.env.WEB_PORT ?? "3000";
const SIGNAL_PORT = process.env.PORT ?? process.env.SIGNALING_PORT ?? "3002";

function listeners(port) {
  try {
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN 2>/dev/null`, {
      encoding: "utf8",
    }).trim();
    return out ? out.split("\n").slice(1) : [];
  } catch {
    return [];
  }
}

const webBusy = listeners(WEB_PORT);
const signalBusy = listeners(SIGNAL_PORT);
const legacySignal = listeners("3001");

if (webBusy.length > 0) {
  console.warn(
    `\n⚠  Port ${WEB_PORT} is already in use. Next.js may move to ${SIGNAL_PORT} and break signaling.\n` +
      `   Stop the old dev server first: lsof -ti :${WEB_PORT} | xargs kill\n` +
      `   Processes:\n${webBusy.map((l) => `   ${l}`).join("\n")}\n`
  );
}

if (legacySignal.length > 0) {
  console.warn(
    `\n⚠  Port 3001 is in use (legacy signaling port). Use port ${SIGNAL_PORT} instead.\n` +
      `   Kill stale process: lsof -ti :3001 | xargs kill\n`
  );
}

if (signalBusy.length > 0) {
  console.warn(
    `\n⚠  Signaling port ${SIGNAL_PORT} is already in use.\n` +
      `   Kill stale process: lsof -ti :${SIGNAL_PORT} | xargs kill\n`
  );
}
