interface JsonLdProps {
  data: object;
}

/** Renders a single `application/ld+json` script tag from a plain object. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // Structured data is always our own generated object, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
