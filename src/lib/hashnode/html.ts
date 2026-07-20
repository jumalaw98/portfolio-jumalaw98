const MAX_UNICODE_CODEPOINT = 0x10ffff;

function safeFromCodePoint(codePoint: number): string {
  if (Number.isNaN(codePoint) || codePoint < 0 || codePoint > MAX_UNICODE_CODEPOINT) {
    return "\uFFFD"; // Unicode replacement character
  }
  return String.fromCodePoint(codePoint);
}

// HTML entity strings built to survive Prettier formatting
const LT = "&" + "lt;";
const GT = "&" + "gt;";
const QUOT = "&" + "quot;";
const APOS = "&" + "apos;";
const AMP = "&" + "amp;";
const NBSP = "&" + "nbsp;";
const HASH_39 = "&" + "#39;";

export function decodeHtmlEntities(text: string): string {
  return text
    .replaceAll(LT, "<")
    .replaceAll(GT, ">")
    .replaceAll(QUOT, '"')
    .replaceAll(HASH_39, "'")
    .replaceAll(APOS, "'")
    .replaceAll(NBSP, " ")
    .replaceAll(/&#(\d+);/g, (_, dec) => safeFromCodePoint(Number.parseInt(dec, 10)))
    .replaceAll(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => safeFromCodePoint(Number.parseInt(hex, 16)))
    .replaceAll(AMP, "&");
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
