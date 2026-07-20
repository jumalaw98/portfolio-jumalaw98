export function decodeHtmlEntities(text: string): string {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&nbsp;", " ")
    .replaceAll(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replaceAll(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replaceAll("&amp;", "&");
}

export function stripHtmlToText(html: string): string {
  let result = "";
  let inTag = false;

  for (const char of html) {
    if (char === "<") {
      inTag = true;
      continue;
    }

    if (char === ">" && inTag) {
      inTag = false;
      result += " ";
      continue;
    }

    if (!inTag) {
      result += char;
    }
  }

  return decodeHtmlEntities(result);
}
