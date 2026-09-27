import { serializeJsonLd } from "@/lib/json-ld";

interface JsonLdProps {
  data: object;
}

/**
 * Renders a single `application/ld+json` script tag from a plain object.
 *
 * Values are escaped by `serializeJsonLd()` because some fields (article
 * titles, summaries) originate from external feeds — a raw `JSON.stringify`
 * could contain `</script>` and break out of the tag. See src/lib/json-ld.ts.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
