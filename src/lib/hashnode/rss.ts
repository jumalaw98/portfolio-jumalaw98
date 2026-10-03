import { XMLParser } from "fast-xml-parser";
import { env } from "@/lib/env";
import { isBlockedHostname } from "@/lib/ssrf";

/**
 * Hashnode retired free GraphQL API access (2026-05-13). The publication's
 * public RSS feed remains free and exposes everything the blog UI needs:
 * title, link, pubDate, categories (tags), dc:creator (author), description
 * (brief), content:encoded (full HTML body), and an enclosure (cover image).
 *
 * This module fetches + parses that feed. It replaces the old GraphQL client
 * for reads. If Hashnode Pro + a token are later adopted, swap the fetch here
 * for an authenticated GraphQL call — the rest of the app is unaffected.
 */

export type HashnodeResult<T> =
  { ok: true; data: T } | { ok: false; error: string; reason: "not_configured" | "fetch_failed" };

export class HashnodeRssError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HashnodeRssError";
  }
}

interface RssItem {
  title: string;
  link: string;
  guid?: string;
  pubDate?: string;
  description?: string;
  "content:encoded"?: string;
  category?: string | string[];
  "dc:creator"?: string;
  enclosure?: { "@_url"?: string };
}

interface RssFeed {
  rss?: {
    channel?: {
      item?: RssItem | RssItem[];
    };
  };
}

const parser = new XMLParser({
  // Keep CDATA as text, don't trim, and preserve namespaced keys as-is.
  cdataPropName: "__cdata",
  trimValues: false,
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Hashnode uses <category> repeatedly; ensure it's always an array.
  isArray: (name) => name === "category" || name === "item",
});

// ─── Egress allowlist (SSRF) ────────────────────────────────────────────────

/** RFC 1035 limits for a dotted DNS name and a single label. */
const MAX_HOSTNAME_LENGTH = 253;
const MAX_HOSTNAME_LABEL_LENGTH = 63;

/**
 * The legal character set of one DNS label: lowercase letters, digits, hyphen.
 *
 * Deliberately a single character-class repetition with anchors — it matches
 * linearly. The label's first/last character rule and the dotted-label layout
 * are checked separately so no expression ever nests a repetition inside
 * another (which is what makes a hostname check backtrack super-linearly).
 */
const HOSTNAME_LABEL_CHARACTERS = /^[a-z0-9-]+$/;

/** True when a single DNS label is well formed: legal chars, no edge hyphens. */
function isValidHostnameLabel(label: string): boolean {
  if (label.length < 1 || label.length > MAX_HOSTNAME_LABEL_LENGTH) return false;
  if (!HOSTNAME_LABEL_CHARACTERS.test(label)) return false;
  return !label.startsWith("-") && !label.endsWith("-");
}

/**
 * True for a bare, dotted DNS hostname — no scheme, path, port, or credentials.
 *
 * Validated label by label (each label with a linear character-class test)
 * rather than by one nested-quantifier regex over the whole name, which
 * backtracks super-linearly on hostile input.
 */
function isDottedHostname(host: string): boolean {
  if (host.length < 1 || host.length > MAX_HOSTNAME_LENGTH) return false;

  const labels = host.split(".");
  if (labels.length < 2) return false;

  return labels.every(isValidHostnameLabel);
}

const RSS_FEED_PATH = "/rss.xml";

/** Builds the HTTPS feed URL for an already-validated hostname. */
function buildRssUrl(hostname: string): string {
  return new URL(RSS_FEED_PATH, `https://${hostname}/`).toString();
}

/**
 * True when a parsed URL is safe to contact: HTTPS, default port, and a
 * hostname that is not a loopback/private/metadata/alias destination.
 *
 * Used for redirect targets, where there is no pre-validated string to compare
 * against — the hostname is validated on its own merits.
 */
function isSafeRssTarget(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  if (url.port) return false;

  // URL.hostname keeps brackets around IPv6 literals ("[::1]"), which
  // node:net's isIPv6 rejects and none of the blocklist patterns match — so
  // strip them (and a DNS root dot) before checking, as validateWebhookUrl
  // already does. Failing open here would let an allowlisted host redirect to
  // a bracketed loopback/private address.
  const hostname = url.hostname.replaceAll("[", "").replaceAll("]", "").replace(/\.$/, "");

  return !isBlockedHostname(hostname);
}

/**
 * True when the parsed feed URL still addresses the exact hostname that was
 * already validated, and that hostname is safe to contact.
 *
 * `isDottedHostname` accepts shorthand numeric forms such as `127.1` or
 * `0300.0250.0.1`, but the URL parser rewrites those into dotted-quad literals
 * (`https://127.1/rss.xml` → `127.0.0.1`) before the request is sent. Checking
 * only the raw string would miss the loopback address the fetch actually
 * contacts, so the parsed hostname is compared against the validated string —
 * any parser rewrite means the URL no longer names the host that was vetted.
 */
function isValidatedRssUrl(url: URL, hostname: string): boolean {
  if (url.hostname !== hostname) return false;
  return isSafeRssTarget(url);
}

/**
 * Drops trailing slashes from a host string.
 *
 * A plain loop rather than `/\/+$/`: the quantified-slash pattern is a
 * super-linear backtracking shape (Sonar S8786), and a linear slice is both
 * cheaper and easier to reason about for attacker-influenced input.
 */
function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end -= 1;
  return value.slice(0, end);
}

/**
 * Normalizes and validates the configured publication host before a URL is
 * built from it. Accepts an operator-friendly value (" https://a.com/ ") but
 * returns null for anything that is not a plain public hostname: injected
 * schemes/paths/ports/credentials all fail validation, and loopback,
 * private-range, cloud-metadata, and wildcard-DNS-alias targets are rejected
 * even when they come from config — a mis-set env var must not reach the network.
 */
function normalizeRssHost(raw: string): string | null {
  const host = stripTrailingSlashes(
    raw
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, ""),
  );

  if (!isDottedHostname(host)) return null;
  if (isBlockedHostname(host)) return null;

  // Re-check through the URL parser so shorthand/alternate IP literals that
  // only become a private address at parse time are caught too.
  let url: URL;
  try {
    url = new URL(RSS_FEED_PATH, `https://${host}/`);
  } catch {
    return null;
  }

  return isValidatedRssUrl(url, host) ? host : null;
}

/**
 * Hosts this fetcher is allowed to contact.
 *
 * `fetchHashnodeRss` is a public helper, so its `host` argument must never be
 * able to aim `fetch` at an arbitrary destination (internal services, cloud
 * metadata, …). Only hosts an operator explicitly configured are fetched —
 * today that is the Hashnode publication host itself — and everything else
 * fails closed with `fetch_failed`. An invalid configured host drops out of
 * the allowlist too, so a bad env value can never be fetched. Adding a mirror
 * feed later means adding its host here (or via config), not widening the
 * fetch.
 */
const ALLOWED_RSS_HOSTS: ReadonlySet<string> = new Set(
  (env.HASHNODE_PUBLICATION_HOST ? [env.HASHNODE_PUBLICATION_HOST] : [])
    .map(normalizeRssHost)
    .filter((host): host is string => host !== null),
);

/**
 * Extracts a plain-text string from a fast-xml-parser value node.
 * Handles CDATA blocks, #text nodes, primitives, and nested objects.
 */
function extractText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return extractObjectText(value as Record<string, unknown>);
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  return "";
}

/**
 * Resolves text from an object-shaped XML node (CDATA, #text, or fallback).
 * Extracted to keep extractText's cognitive complexity within limits.
 */
function extractObjectText(obj: Record<string, unknown>): string {
  if ("__cdata" in obj) {
    const cdata = obj.__cdata;
    return typeof cdata === "string" ? cdata : extractText(cdata);
  }
  if ("#text" in obj) {
    const text = obj["#text"];
    return typeof text === "string" ? text : extractText(text);
  }
  try {
    const serialized = JSON.stringify(obj);
    return typeof serialized === "string" ? serialized : "";
  } catch {
    return "";
  }
}

/** Maximum redirect hops followed for a feed before giving up. */
const MAX_RSS_REDIRECTS = 3;

/** HTTP statuses that carry a `Location` header. */
const REDIRECT_STATUSES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308]);

/**
 * Resolves and validates a redirect target.
 *
 * `fetch` follows redirects on its own by default, which would let an
 * allowlisted host bounce the request to a private, metadata, or non-allowlisted
 * destination — the guard would have vetted a host that is never contacted.
 * Each hop is therefore resolved and re-checked against the same allowlist
 * before it is issued. Returns null when the target is not safe to follow.
 */
function resolveRssRedirect(location: string, currentUrl: string): string | null {
  let target: URL;
  try {
    target = new URL(location, currentUrl);
  } catch {
    return null;
  }

  if (!isSafeRssTarget(target)) return null;
  if (!ALLOWED_RSS_HOSTS.has(target.hostname)) return null;

  return target.toString();
}

/**
 * Fetches the raw RSS XML for a publication host, following redirects manually
 * so every hop is re-validated. Returns a discriminated result so callers can
 * tell "not configured" apart from "the network/feed failed" — failures must
 * be visible, never silently swallowed into placeholder mode.
 *
 * The host is validated (bare public hostname) and checked against the egress
 * allowlist before any request leaves the process — see ALLOWED_RSS_HOSTS.
 */
export async function fetchHashnodeRss(
  host: string,
  options: { revalidate?: number; tags?: string[] } = {},
): Promise<HashnodeResult<string>> {
  if (!host) {
    return { ok: false, error: "HASHNODE_PUBLICATION_HOST is not set", reason: "not_configured" };
  }

  const hostname = normalizeRssHost(host);
  if (!hostname) {
    return { ok: false, error: "Blocked unsafe Hashnode RSS host", reason: "fetch_failed" };
  }

  const { revalidate = 3600, tags } = options;

  try {
    // SSRF guard: the request is only issued from inside this allowlist check,
    // so no caller-supplied host can reach `fetch` without being on it.
    if (ALLOWED_RSS_HOSTS.has(hostname)) {
      const result = await fetchRssFeed(buildRssUrl(hostname), { revalidate, tags });
      if (!result.ok) return result;

      return { ok: true, data: await result.response.text() };
    }

    return {
      ok: false,
      error: `Hashnode RSS host "${hostname}" is not on the egress allowlist`,
      reason: "fetch_failed",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Hashnode RSS request threw: ${message}`, reason: "fetch_failed" };
  }
}

/**
 * Parses one request destination and vets it on its own merits: HTTPS only,
 * default port, and a hostname that is not loopback/private/metadata/aliased.
 *
 * Returns null when the value cannot be parsed or is not safe to contact, so
 * a caller can fail closed before a request is issued.
 */
function parseRssDestination(value: string): URL | null {
  let target: URL;
  try {
    target = new URL(value);
  } catch {
    return null;
  }
  return isSafeRssTarget(target) ? target : null;
}

/** Outcome of issuing one request to a single (already vetted) destination. */
type RssHopOutcome =
  | { kind: "done"; response: Response }
  | { kind: "redirect"; next: string }
  | { kind: "failed"; error: string };

/**
 * Issues one feed request to an already-vetted destination with
 * `redirect: "manual"`, and classifies the response: a redirect target to
 * follow, a usable response, or a terminal failure.
 *
 * Extracted from fetchRssFeed to keep both functions within the cognitive
 * complexity budget while preserving the ordering that matters for SSRF: the
 * allowlist check happens in this function, immediately before `fetch`, so no
 * destination reaches the network unvetted — see ALLOWED_RSS_HOSTS.
 */
async function requestRssHop(
  destination: URL,
  init: { revalidate: number; tags?: string[] },
): Promise<RssHopOutcome> {
  if (!ALLOWED_RSS_HOSTS.has(destination.hostname)) {
    return {
      kind: "failed",
      error: `Hashnode RSS host "${destination.hostname}" is not on the egress allowlist`,
    };
  }

  const response = await fetch(destination.toString(), {
    headers: { Accept: "application/xml, text/xml, application/rss+xml" },
    redirect: "manual",
    next: { revalidate: init.revalidate, tags: init.tags },
  });

  if (REDIRECT_STATUSES.has(response.status)) {
    const location = response.headers.get("location");
    const next = location ? resolveRssRedirect(location, destination.toString()) : null;

    return next
      ? { kind: "redirect", next }
      : {
          kind: "failed",
          error: `Hashnode RSS redirect to a blocked or non-allowlisted host (status ${response.status})`,
        };
  }

  if (!response.ok) {
    return { kind: "failed", error: `Hashnode RSS request failed with status ${response.status}` };
  }

  return { kind: "done", response };
}

/**
 * Issues the feed request with `redirect: "manual"` and follows at most
 * MAX_RSS_REDIRECTS hops, re-validating every destination. Returns the
 * successful response, or a failure result for a blocked/broken redirect chain.
 *
 * Each hop is parsed (parseRssDestination) and checked against the egress
 * allowlist (requestRssHop) before the request is issued.
 */
async function fetchRssFeed(
  url: string,
  init: { revalidate: number; tags?: string[] },
): Promise<
  { ok: true; response: Response } | { ok: false; error: string; reason: "fetch_failed" }
> {
  let current = url;

  for (let hop = 0; hop <= MAX_RSS_REDIRECTS; hop += 1) {
    const destination = parseRssDestination(current);
    if (!destination) {
      return {
        ok: false,
        error: "Hashnode RSS request destination is not a valid safe URL",
        reason: "fetch_failed",
      };
    }

    const outcome = await requestRssHop(destination, init);

    if (outcome.kind === "redirect") {
      current = outcome.next;
      continue;
    }

    if (outcome.kind === "failed") {
      return { ok: false, error: outcome.error, reason: "fetch_failed" };
    }

    return { ok: true, response: outcome.response };
  }

  return {
    ok: false,
    error: `Hashnode RSS exceeded ${MAX_RSS_REDIRECTS} redirects`,
    reason: "fetch_failed",
  };
}

/** Parses RSS XML into a normalized list of items. */
export function parseHashnodeRss(xml: string): RssItem[] {
  const parsed = parser.parse(xml) as RssFeed;
  const channel = parsed.rss?.channel;
  if (!channel) {
    throw new HashnodeRssError(
      "RSS feed is missing a <channel> element — the response may not be a valid feed.",
    );
  }
  const items = channel.item ?? [];
  return Array.isArray(items) ? items : [items];
}

export { extractText };
export type { RssItem };
