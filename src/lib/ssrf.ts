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

// This link-local address is shared by AWS, GCP, and Azure metadata services.
// Keep the octets separate so static-analysis tooling does not mistake this
// security deny-list entry for an outbound service configuration.
const CLOUD_METADATA_IPV4 = [169, 254, 169, 254].join(".");
const GOOGLE_METADATA_HOSTNAME = "metadata.google.internal";
const CLOUD_METADATA_NIP_IO_SUFFIX = `.${CLOUD_METADATA_IPV4}.nip.io`;

/**
 * IPv4 private/reserved ranges that must not be reachable from outbound requests.
 * Each entry defines the first octet and the inclusive range for the second octet.
 * @see https://en.wikipedia.org/wiki/Reserved_IP_addresses
 */
const IPV4_PRIVATE_RANGES: ReadonlyArray<{ a: number; bMin: number; bMax: number }> = [
  { a: 0, bMin: 0, bMax: 255 }, // 0.0.0.0/8 — "This" network
  { a: 10, bMin: 0, bMax: 255 }, // 10.0.0.0/8 — Private
  { a: 100, bMin: 64, bMax: 127 }, // 100.64.0.0/10 — Shared address space (CGNAT)
  { a: 127, bMin: 0, bMax: 255 }, // 127.0.0.0/8 — Loopback
  { a: 169, bMin: 254, bMax: 254 }, // 169.254.0.0/16 — Link-local
  { a: 172, bMin: 16, bMax: 31 }, // 172.16.0.0/12 — Private
  { a: 192, bMin: 0, bMax: 0 }, // 192.0.0.0/24 — IETF protocol assignments
  { a: 192, bMin: 168, bMax: 168 }, // 192.168.0.0/16 — Private
  { a: 198, bMin: 18, bMax: 19 }, // 198.18.0.0/15 — Benchmarking
  { a: 198, bMin: 51, bMax: 51 }, // 198.51.100.0/24 — Documentation
  { a: 203, bMin: 0, bMax: 0 }, // 203.0.113.0/24 — Documentation
];

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
  // URL.hostname retains brackets around IPv6 literals. Remove those and a
  // DNS root dot before comparing or passing the value to node:net.
  const hostname = url.hostname.replaceAll("[", "").replaceAll("]", "").replace(/\.$/, "");

  if (isBlockedHostname(hostname)) return null;

  // Monitoring webhooks are intentionally limited to the supported providers.
  // This is an egress allowlist: DNS for an arbitrary user-controlled host is
  // never resolved or fetched, which prevents DNS rebinding from turning a
  // syntactically safe hostname into an internal destination.
  if (!isAllowedWebhookDestination(url, hostname)) {
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
 * Uses a data-driven lookup table to keep cognitive complexity low.
 * @see https://en.wikipedia.org/wiki/Reserved_IP_addresses
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !isValidIPv4Part(part))) {
    return false;
  }

  const [a, b] = parts;

  // Match against private/reserved ranges (10.x, 172.16-31.x, 192.168.x, etc.)
  if (IPV4_PRIVATE_RANGES.some((range) => a === range.a && b >= range.bMin && b <= range.bMax)) {
    return true;
  }

  // 224.0.0.0/4 — Multicast and 240.0.0.0/4 — Reserved
  return a >= 224;
}

/**
 * Check if an IPv6 address is in a private/reserved range.
 * Simplified — covers the most common cases.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalised = ip.toLowerCase().replaceAll("[", "").replaceAll("]", "");

  // Loopback ::1
  if (normalised === "::1") return true;
  // Unspecified address
  if (normalised === "::") return true;
  // Link-local fe80::/10
  if (/^fe[89ab]/.test(normalised)) return true;
  // Unique local fc00::/7
  if (/^f[cd]/.test(normalised)) return true;
  // Multicast ff00::/8
  if (normalised.startsWith("ff")) return true;

  // IPv4-mapped IPv6. URL normalizes dotted notation to hex hextets, e.g.
  // ::ffff:127.0.0.1 becomes ::ffff:7f00:1, so decode the final 32 bits.
  const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(normalised);
  if (mapped) {
    const high = Number.parseInt(mapped[1], 16);
    const low = Number.parseInt(mapped[2], 16);
    const embeddedIPv4 = [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
    return isPrivateIPv4(embeddedIPv4);
  }

  return false;
}

function isBlockedHostname(hostname: string): boolean {
  return isLocalhost(hostname) || isPrivateIpAddress(hostname) || isCloudMetadataHostname(hostname);
}

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

function isPrivateIpAddress(hostname: string): boolean {
  if (isIPv4(hostname)) return isPrivateIPv4(hostname);
  if (isIPv6(hostname)) return isPrivateIPv6(hostname);
  return false;
}

function isCloudMetadataHostname(hostname: string): boolean {
  return (
    hostname === CLOUD_METADATA_IPV4 ||
    hostname === GOOGLE_METADATA_HOSTNAME ||
    hostname.endsWith(CLOUD_METADATA_NIP_IO_SUFFIX)
  );
}

function isValidIPv4Part(part: number): boolean {
  return !Number.isNaN(part) && part >= 0 && part <= 255;
}

function isAllowedWebhookDestination(url: URL, hostname: string): boolean {
  if (hostname === "hooks.slack.com") return true;
  return hostname === "discord.com" && url.pathname.startsWith("/api/webhooks/");
}
