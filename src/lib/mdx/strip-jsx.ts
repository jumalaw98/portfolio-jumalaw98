/**
 * Strip MDX component syntax (JSX tags, imports) from MDX content.
 * Preserves standard markdown within fenced code blocks.
 */

/**
 * Strip MDX down to plain markdown — removes JSX component tags and imports
 * while preserving fenced code blocks, standard markdown, and links.
 * Suitable for dev.to publishing where links should remain intact.
 */
export function mdxToMarkdown(mdx: string): string {
  const parts = mdx.split(/(```[\s\S]*?```)/g);
  const processed = parts.map((part, i) => {
    if (i % 2 === 1) return part; // Preserve code blocks
    return part
      .replace(/^import\s.*$/gm, "")
      .replace(/<[A-Z][a-zA-Z]*\s*\/?>/g, "")
      .replace(/<[A-Z][a-zA-Z]*\s[^>]*>/g, "")
      .replace(/<\/[A-Z][a-zA-Z]*>/g, "");
  });
  return processed.join("").trim();
}

/**
 * Strip MDX down to plain text for LLM consumption — same as mdxToMarkdown
 * but additionally removes images and unwraps links (replaces [text](url) with text).
 * Suitable for generating AI summaries where link text matters more than URLs.
 */
export function mdxToPlainText(mdx: string): string {
  const markdown = mdxToMarkdown(mdx);
  return (
    unwrapMarkdownLinks(markdown)
      // Remove markdown image references
      .replace(/!\[.*?\]\(.*?\)/g, "")
      // Remove code-fence markers but keep content
      .replace(/```\w*/g, "")
      // Strip frontmatter if any slipped through
      .replace(/^---[\s\S]*?---\n/, "")
      .trim()
  );
}

function isEscaped(markdown: string, index: number): boolean {
  let backslashCount = 0;
  let i = index - 1;
  while (i >= 0 && markdown[i] === "\\") {
    backslashCount += 1;
    i -= 1;
  }
  // Odd number of backslashes means the character is escaped
  return backslashCount % 2 === 1;
}

function unwrapMarkdownLinks(markdown: string): string {
  let result = "";
  let cursor = 0;

  while (cursor < markdown.length) {
    const labelStart = markdown.indexOf("[", cursor);
    if (labelStart === -1) {
      result += markdown.slice(cursor);
      break;
    }

    // Skip backslash-escaped `\[` — it renders as literal `[`, not a link opener
    if (isEscaped(markdown, labelStart)) {
      result += markdown.slice(cursor, labelStart + 1);
      cursor = labelStart + 1;
      continue;
    }

    const labelEnd = markdown.indexOf("]", labelStart + 1);
    const isImageReference = labelStart > 0 && markdown[labelStart - 1] === "!";
    if (
      isImageReference ||
      labelEnd === -1 ||
      // Skip backslash-escaped `\]` — literal `]`, not a label closer
      isEscaped(markdown, labelEnd) ||
      markdown[labelEnd + 1] !== "("
    ) {
      result += markdown.slice(cursor, labelStart + 1);
      cursor = labelStart + 1;
      continue;
    }

    const destinationEnd = findMarkdownDestinationEnd(markdown, labelEnd + 2);
    if (destinationEnd === -1) {
      result += markdown.slice(cursor, labelStart + 1);
      cursor = labelStart + 1;
      continue;
    }

    result += markdown.slice(cursor, labelStart);
    result += markdown.slice(labelStart + 1, labelEnd);
    cursor = destinationEnd + 1;
  }

  return result;
}

function handleQuotedTitle(
  markdown: string,
  index: number,
  quoteChar: string,
): { newIndex: number; inQuotedTitle: string | null } {
  for (let i = index; i < markdown.length; i += 1) {
    const ch = markdown[i];
    if (ch === "\\") {
      i += 1; // skip escaped character inside title
      continue;
    }
    if (ch === quoteChar) {
      return { newIndex: i, inQuotedTitle: null }; // end of quoted title
    }
  }
  return { newIndex: markdown.length, inQuotedTitle: null };
}

function findMarkdownDestinationEnd(markdown: string, startIndex: number): number {
  let parenthesesDepth = 0;
  let inQuotedTitle: string | null = null;
  let index = startIndex;

  while (index < markdown.length) {
    const character = markdown[index];

    if (inQuotedTitle !== null) {
      const result = handleQuotedTitle(markdown, index, inQuotedTitle);
      // handleQuotedTitle returns the position of the closing quote.
      // Advance past it so the main loop doesn't re-enter the quoted-title
      // state on the next iteration (which would look for a second closing
      // quote that doesn't exist, causing findMarkdownDestinationEnd to
      // return -1).
      index = result.newIndex + 1;
      inQuotedTitle = result.inQuotedTitle;
      continue;
    }

    if (character === "\\") {
      index += 1;
      continue;
    }

    if (character === '"' || character === "'") {
      inQuotedTitle = character;
      index += 1;
      continue;
    }

    if (character === "(") {
      parenthesesDepth += 1;
      index += 1;
      continue;
    }

    if (character === ")") {
      if (parenthesesDepth === 0) {
        return index;
      }
      parenthesesDepth -= 1;
    }

    index += 1;
  }

  return -1;
}
