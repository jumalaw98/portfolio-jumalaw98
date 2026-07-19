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
      continue;
    }

    if (!inTag) {
      result += char;
    }
  }

  return result;
}
