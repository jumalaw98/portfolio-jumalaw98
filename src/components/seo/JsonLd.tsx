import { serializeJsonLd } from "@/lib/json-ld";

interface JsonLdProps {
  data: object;
}

/**
 * Renders a single `application/ld+json` script tag from a plain object.
 *
 * The serialized JSON is passed as a text child instead of through
 * `dangerouslySetInnerHTML`. React 19 renders text children of `<script>`
 * as raw text (no entity escaping, so the payload stays valid JSON for
 * search engines) and additionally neutralizes any `</script` sequence in
 * the child, so external feed content cannot break out of the tag or inject
 * markup. Verified against react-dom 19: server rendering emits the escaped
 * JSON as-is, and hydration preserves the script content exactly.
 *
 * Values are still escaped by `serializeJsonLd()` as defence in depth because
 * some fields (article titles, summaries) originate from external feeds — a
 * raw `JSON.stringify` could contain `</script>` and break out of the tag.
 * See src/lib/json-ld.ts.
 */
export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json">{serializeJsonLd(data)}</script>;
}
