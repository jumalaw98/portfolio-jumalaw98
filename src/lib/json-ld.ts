/**
 * Serialize structured data for a `<script type="application/ld+json">` block.
 *
 * `JSON.stringify` alone is not safe inside a `<script>` element: the HTML
 * parser ends the script at the first `</script>` sequence, so a value that
 * contains one (e.g. an article title coming from an external RSS feed) would
 * break out of the tag and inject markup — a stored XSS.
 *
 * Escaping every `<` as `\u003c` keeps the payload valid JSON (the escape is
 * decoded by `JSON.parse` and by search engines reading the block) while
 * removing the `</script>`, `<!--` and `<script` sequences the parser reacts to.
 *
 * @param data - Structured data (JSON-LD object)
 * @returns JSON text that is safe to embed in a script element
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}
