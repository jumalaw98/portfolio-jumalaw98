import { describe, it, expect } from "vitest";
import { serializeJsonLd } from "@/lib/json-ld";

/**
 * Security regression tests for JSON-LD serialization.
 *
 * The payload is embedded in `<script type="application/ld+json">`, where the
 * HTML parser terminates the element on the first `</script>` sequence. Some
 * values (post titles, briefs) come from an external RSS feed, so the
 * serializer must remove every `<` that could start a tag.
 */

describe("serializeJsonLd", () => {
  it("escapes </script> so the script element cannot be closed early", () => {
    const payload = { headline: "Safe</script><img src=x onerror=alert(1)>" };

    const json = serializeJsonLd(payload);

    expect(json).not.toContain("</script");
    expect(json).not.toContain("<img");
    expect(json).toContain("\\u003c/script");
  });

  it("escapes HTML comment openers", () => {
    expect(serializeJsonLd({ description: "<!-- hidden -->" })).not.toContain("<!--");
  });

  it("preserves the original data when parsed back", () => {
    const payload = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Escaping & <script> tags",
      nested: { list: ["a<b", "c>d"] },
    };

    expect(JSON.parse(serializeJsonLd(payload))).toEqual(payload);
  });

  it("produces valid JSON for plain data", () => {
    expect(serializeJsonLd({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
  });
});
