/** Loopback and *.local hostnames used during local development. */
export function isLocalDevHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local")
  );
}

/** RFC1918 / link-local addresses reachable on a LAN. */
export function isPrivateNetworkHost(hostname: string): boolean {
  if (hostname.endsWith(".local")) return true;

  // IPv4
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (match) {
    const [, a, b] = match.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }

  // IPv6 ULA (fc00::/7) and link-local (fe80::/10)
  const lower = hostname.toLowerCase();
  return lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:");
}

export function isDevNetworkHost(hostname: string): boolean {
  return isLocalDevHost(hostname) || isPrivateNetworkHost(hostname);
}

export function isAllowedDevOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return isDevNetworkHost(url.hostname);
  } catch {
    return false;
  }
}
