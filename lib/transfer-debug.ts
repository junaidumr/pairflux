const ENABLED =
  typeof process !== "undefined"
    ? process.env.NODE_ENV !== "production"
    : typeof window !== "undefined";

export function tlog(...args: unknown[]): void {
  if (ENABLED) console.log("[peer-beam:transfer]", ...args);
}
