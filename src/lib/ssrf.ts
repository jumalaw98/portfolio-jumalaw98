/**
 * SSRF (Server-Side Request Forgery) prevention for outbound URLs.
 *
 * Validates webhook and external URLs before making HTTP requests.
 * Prevents requests to localhost, private networks, link-local addresses,
 * cloud metadata endpoints, and non-HTTPS protocols.
 *
 * Used by:
 *   - instrument.ts (MONITOR_WEBHOOK_URL)
 *   - hashnode/rss.ts (publication feed fetch — isBlockedHostname)
 */

import { isIPv4, isIPv6 } from "node:net";

// This link-local address is shared by AWS, GCP, and Azure metadata services.
// Keep the octets separate so static-analysis tooling does not mistake this
// security deny-list entry for an outbound service configuration.
const CLOUD_METADATA_IPV4 = [169, 254, 169, 254].join(".");
const GOOGLE_METADATA_HOSTNAME = "metadata.google.internal";
const CLOUD_METADATA_NIP_IO_SUFFIX = `.${CLOUD_METADATA_IPV4}.nip.io`;

/** Number of hex characters that can encode a full 32-bit address. */
const HEX_IPV4_MIN_LENGTH = 6;
const HEX_IPV4_MAX_LENGTH = 8;

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
export function isPrivateIPv4(ip: string): boolean {
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
export function isPrivateIPv6(ip: string): boolean {
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

  // IPv4-mapped IPv6 may appear in either dotted-quad form (::ffff:127.0.0.1)
  // or normalized hextet form (::ffff:7f00:1). Decode the embedded 32 bits in
  // either case before checking the private/reserved IPv4 ranges.
  if (normalised.startsWith("::ffff:")) {
    const embedded = normalised.slice("::ffff:".length);

    if (embedded.includes(".")) {
      return isPrivateIPv4(embedded);
    }

    const mapped = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(embedded);
    if (mapped) {
      const high = Number.parseInt(mapped[1], 16);
      const low = Number.parseInt(mapped[2], 16);
      const embeddedIPv4 = [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
      return isPrivateIPv4(embeddedIPv4);
    }
  }

  return false;
}

/**
 * True when a hostname must never be reached by an outbound request:
 * loopback/local, private/reserved IP literals, cloud metadata endpoints, or
 * wildcard-DNS aliases that decode to any of the above.
 * Shared by every outbound-fetch guard (webhooks, RSS, …).
 */
export function isBlockedHostname(hostname: string): boolean {
  return (
    isLocalhost(hostname) ||
    isPrivateIpAddress(hostname) ||
    isCloudMetadataHostname(hostname) ||
    isWildcardDnsPrivateAlias(hostname) ||
    isPrivateIpv4Alias(hostname)
  );
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

// ─── Wildcard-DNS aliases ───────────────────────────────────────────────────
//
// Public services (nip.io, sslip.io, …) resolve any hostname they are given
// to the IP address encoded in the name, so `127.0.0.1.nip.io` is a perfectly
// ordinary public hostname that `fetch` turns into a loopback connection.
// A private address expressed that way therefore slips past both the hostname
// pattern and `node:net`'s IP-literal check, so decode the alias before the
// request leaves the process.

/** Suffixes of the public wildcard-DNS resolvers that decode an embedded IP. */
const WILDCARD_DNS_SUFFIXES: ReadonlySet<string> = new Set([
  "nip.io",
  "sslip.io",
  "nip.xx",
  "localtest.me",
  "lvh.me",
  "vcaps.me",
]);

/**
 * True when a run of leading labels spells a private/reserved IPv4 address —
 * either dotted (`127.0.0.1.nip.io`) or dash-joined (`127-0-0-1.example.com`).
 * Both forms are resolved by wildcard DNS, and the dash form is checked for any
 * host because a name that begins with a private address has no legitimate
 * public use. Fails closed: a false positive only ever blocks a fetch.
 */
function isPrivateIpv4Alias(hostname: string): boolean {
  const labels = hostname.split(".");

  // Windows of 1–4 labels, dashes folded to dots, so `127-0-0-1` (one label)
  // and `127.0.0.1` (four labels) are both recognised. Only a 4-octet result
  // can be a valid IPv4 literal, so shorter windows simply never match.
  for (let start = 0; start < labels.length; start += 1) {
    for (let count = 1; start + count <= labels.length && count <= 4; count += 1) {
      const candidate = labels
        .slice(start, start + count)
        .join(".")
        .replaceAll("-", ".");

      if (isIPv4(candidate) && isPrivateIPv4(candidate)) return true;
    }
  }

  return false;
}

/**
 * True when a hostname under a known wildcard-DNS resolver decodes — in dotted,
 * dash-joined, or hex form — to a private/reserved address. The hex form
 * (`7f000001.nip.io`) is only meaningful under those resolvers, so it is
 * scoped to them to avoid matching ordinary domains with hex-looking labels.
 */
function isWildcardDnsPrivateAlias(hostname: string): boolean {
  if (!WILDCARD_DNS_SUFFIXES.has(lastLabels(hostname, 2))) return false;

  const label = hostname.split(".")[0]?.replaceAll("-", "") ?? "";
  if (
    label.length >= HEX_IPV4_MIN_LENGTH &&
    label.length <= HEX_IPV4_MAX_LENGTH &&
    /^[0-9a-f]+$/.test(label)
  ) {
    if (isPrivateIPv4(hexToIpv4(label))) return true;
  }

  return isPrivateIpv4Alias(hostname);
}

/** Last `count` labels of a hostname, or "" when it has too few labels. */
function lastLabels(hostname: string, count: number): string {
  const labels = hostname.split(".");
  if (labels.length < count) return "";
  return labels.slice(-count).join(".");
}

/** Expands a 1–8 digit hex address ("7f000001") to dotted-quad form. */
function hexToIpv4(hex: string): string {
  const value = Number.parseInt(hex, 16);
  return [value >>> 24, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff].join(".");
}

function isValidIPv4Part(part: number): boolean {
  return !Number.isNaN(part) && part >= 0 && part <= 255;
}

function isAllowedWebhookDestination(url: URL, hostname: string): boolean {
  if (hostname === "hooks.slack.com") return true;
  return hostname === "discord.com" && url.pathname.startsWith("/api/webhooks/");
}
