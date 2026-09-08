/**
 * SSRF (Server-Side Request Forgery) prevention for outbound URLs.
 *
 * Validates webhook and external URLs before making HTTP requests.
 * Prevents requests to localhost, private networks, link-local addresses,
 * cloud metadata endpoints, and non-HTTPS protocols.
 *
 * Used by:
 *   - instrument.ts (MONITOR_WEBHOOK_URL)
 */

import { isIPv4, isIPv6 } from "node:net";

/**
 * Result of webhook URL validation.
 * Returns a validated URL object on success, null on failure.
 */
export function validateWebhookUrl(urlString: string): URL | null {
  // 1. Parse the URL
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }

  // 2. HTTPS only
  if (url.protocol !== "https:") {
    return null;
  }

  // 3. Block private / loopback / link-local / metadata IPs
  const hostname = url.hostname;

  // Block localhost variants
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  ) {
    return null;
  }

  // Block IPv4 private ranges
  if (isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return null;
    }
  }

  // Block IPv6 private/reserved ranges
  if (isIPv6(hostname)) {
    if (isPrivateIPv6(hostname)) {
      return null;
    }
  }

  // Block cloud metadata endpoints
  if (
    hostname === "169.254.169.254" || // AWS/GCP/Azure metadata
    hostname === "metadata.google.internal" || // GCP metadata
    hostname === "169.254.169.254.nip.io" || // DNS rebinding variant
    hostname.endsWith(".169.254.169.254.nip.io") // DNS rebinding variant
  ) {
    return null;
  }

  // 4. Block unexpected ports (only 443 for HTTPS)
  if (url.port && url.port !== "443" && url.port !== "") {
    return null;
  }

  return url;
}

/**
 * Check if an IPv4 address is in a private/reserved range.
 * @see https://en.wikipedia.org/wiki/Reserved_IP_addresses
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;

  // 0.0.0.0/8 — "This" network
  if (a === 0) return true;
  // 10.0.0.0/8 — Private
  if (a === 10) return true;
  // 100.64.0.0/10 — Shared address space (CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 — Loopback
  if (a === 127) return true;
  // 169.254.0.0/16 — Link-local
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 — Private
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 — IETF protocol assignments
  if (a === 192 && b === 0) return true;
  // 192.168.0.0/16 — Private
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 — Benchmarking
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 — Documentation
  if (a === 198 && b === 51) return true;
  // 203.0.113.0/24 — Documentation
  if (a === 203 && b === 0) return true;
  // 224.0.0.0/4 — Multicast
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 — Reserved
  if (a >= 240) return true;

  return false;
}

/**
 * Check if an IPv6 address is in a private/reserved range.
 * Simplified — covers the most common cases.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalised = ip.toLowerCase().replace(/\[|\]/g, "");

  // Loopback ::1
  if (normalised === "::1") return true;
  // Link-local fe80::/10
  if (normalised.startsWith("fe80")) return true;
  // Unique local fc00::/7
  if (normalised.startsWith("fc") || normalised.startsWith("fd")) return true;
  // Multicast ff00::/8
  if (normalised.startsWith("ff")) return true;

  return false;
}
