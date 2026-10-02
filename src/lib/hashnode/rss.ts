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

/** A bare, dotted DNS hostname — no scheme, path, port, or credentials. */
const RSS_HOSTNAME_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

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
  return !isBlockedHostname(url.hostname);
}

/**
 * True when the parsed feed URL still addresses the exact hostname that was
 * already validated, and that hostname is safe to contact.
 *
 * `RSS_HOSTNAME_PATTERN` accepts shorthand numeric forms such as `127.1` or
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
 * Normalizes and validates the configured publication host before a URL is
 * built from it. Accepts an operator-friendly value (" https://a.com/ ") but
 * returns null for anything that is not a plain public hostname: injected
 * schemes/paths/ports/credentials all fail the pattern, and loopback,
 * private-range, cloud-metadata, and wildcard-DNS-alias targets are rejected
 * even when they come from config — a mis-set env var must not reach the network.
 */
function normalizeRssHost(raw: string): string | null {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  if (!RSS_HOSTNAME_PATTERN.test(host)) return null;
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
 * Issues the feed request with `redirect: "manual"` and follows at most
 * MAX_RSS_REDIRECTS hops, re-validating every destination. Returns the
 * successful response, or a failure result for a blocked/broken redirect chain.
 */
async function fetchRssFeed(
  url: string,
  init: { revalidate: number; tags?: string[] },
): Promise<
  { ok: true; response: Response } | { ok: false; error: string; reason: "fetch_failed" }
> {
  let current = url;

  for (let hop = 0; hop <= MAX_RSS_REDIRECTS; hop += 1) {
    const response = await fetch(current, {
      headers: { Accept: "application/xml, text/xml, application/rss+xml" },
      redirect: "manual",
      next: { revalidate: init.revalidate, tags: init.tags },
    });

    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers.get("location");
      const next = location ? resolveRssRedirect(location, current) : null;

      if (!next) {
        return {
          ok: false,
          error: `Hashnode RSS redirect to a blocked or non-allowlisted host (status ${response.status})`,
          reason: "fetch_failed",
        };
      }

      current = next;
      continue;
    }

    if (!response.ok) {
      return {
        ok: false,
        error: `Hashnode RSS request failed with status ${response.status}`,
        reason: "fetch_failed",
      };
    }

    return { ok: true, response };
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
