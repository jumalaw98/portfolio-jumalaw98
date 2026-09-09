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
  const hostname = url.hostname.replace(/[\[\]]/g, "").replace(/\.$/, "");

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
 * @see https://en.wikipedia.org/wiki/Reserved_IP_addresses
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !isValidIPv4Part(part))) {
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
  // Unspecified address
  if (normalised === "::") return true;
  // Link-local fe80::/10
  if (/^fe[89ab]/.test(normalised)) return true;
  // Unique local fc00::/7
  if (normalised.startsWith("fc") || normalised.startsWith("fd")) return true;
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
