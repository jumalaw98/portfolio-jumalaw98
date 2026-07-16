import { XMLParser } from "fast-xml-parser";

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

function extractText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  // fast-xml-parser puts CDATA text under the cdataPropName key.
  if (typeof value === "object" && "__cdata" in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>).__cdata ?? "");
  }
  return String(value);
}

/**
 * Fetches the raw RSS XML for a publication host.
 * Returns a discriminated result so callers can tell "not configured" apart
 * from "the network/feed failed" — failures must be visible, never silently
 * swallowed into placeholder mode.
 */
export async function fetchHashnodeRss(
  host: string,
  options: { revalidate?: number; tags?: string[] } = {},
): Promise<HashnodeResult<string>> {
  if (!host) {
    return { ok: false, error: "HASHNODE_PUBLICATION_HOST is not set", reason: "not_configured" };
  }

  const url = `https://${host}/rss.xml`;
  const { revalidate = 3600, tags } = options;

  try {
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
