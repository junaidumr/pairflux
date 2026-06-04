"use client";

import { BUFFERED_AMOUNT_HIGH, BUFFERED_AMOUNT_LOW } from "@/lib/constants";
import { tlog } from "@/lib/transfer-debug";

export function getBufferedAmount(channel: RTCDataChannel): number {
  return channel.bufferedAmount;
}

export function configureChannelBufferThresholds(channel: RTCDataChannel): void {
  channel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_LOW;
}

export function waitForBufferDrain(
  channel: RTCDataChannel,
  timeoutMs = 120_000
): Promise<boolean> {
  if (channel.readyState !== "open") return Promise.resolve(false);
  if (channel.bufferedAmount <= BUFFERED_AMOUNT_HIGH) return Promise.resolve(true);

  tlog("bufferedAmount high, waiting for drain", channel.bufferedAmount);

  return new Promise((resolve) => {
    let settled = false;

    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.removeEventListener("bufferedamountlow", onLow);
      resolve(ok);
    };

    const onLow = () => {
      tlog("bufferedamountlow", channel.bufferedAmount);
      if (channel.bufferedAmount <= BUFFERED_AMOUNT_HIGH) {
        done(true);
      }
    };

    const timer = setTimeout(() => {
      tlog("buffer drain timeout", channel.bufferedAmount);
      done(false);
    }, timeoutMs);

    channel.addEventListener("bufferedamountlow", onLow);

    const poll = setInterval(() => {
      if (channel.readyState !== "open") {
        clearInterval(poll);
        done(false);
        return;
      }
      if (channel.bufferedAmount <= BUFFERED_AMOUNT_HIGH) {
        clearInterval(poll);
        done(true);
      }
    }, 50);
  });
}
