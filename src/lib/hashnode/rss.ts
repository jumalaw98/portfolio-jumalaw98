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

/**
 * Normalizes and validates the configured publication host before a URL is
 * built from it. Accepts an operator-friendly value (" https://a.com/ ") but
 * returns null for anything that is not a plain public hostname: injected
 * schemes/paths/ports/credentials all fail the pattern, and loopback,
 * private-range, and cloud-metadata targets are rejected even when they come
 * from config — a mis-set env var must not reach the network.
 */
function normalizeRssHost(raw: string): string | null {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  if (!RSS_HOSTNAME_PATTERN.test(host)) return null;
  if (isBlockedHostname(host)) return null;
  return host;
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

/**
 * Fetches the raw RSS XML for a publication host.
 * Returns a discriminated result so callers can tell "not configured" apart
 * from "the network/feed failed" — failures must be visible, never silently
 * swallowed into placeholder mode.
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

  const url = `https://${hostname}/rss.xml`;
  const { revalidate = 3600, tags } = options;

  try {
    // SSRF guard: the request is only issued from inside this allowlist check,
    // so no caller-supplied host can reach `fetch` without being on it.
    if (ALLOWED_RSS_HOSTS.has(hostname)) {
      const response = await fetch(url, {
        headers: { Accept: "application/xml, text/xml, application/rss+xml" },
        next: { revalidate, tags },
      });

      if (!response.ok) {
        return {
          ok: false,
          error: `Hashnode RSS request failed with status ${response.status}`,
          reason: "fetch_failed",
        };
      }

      const xml = await response.text();
      return { ok: true, data: xml };
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
