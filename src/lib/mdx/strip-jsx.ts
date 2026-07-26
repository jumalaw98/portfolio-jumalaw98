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

function unwrapMarkdownLinks(markdown: string): string {
  let result = "";
  let cursor = 0;

  while (cursor < markdown.length) {
    const labelStart = markdown.indexOf("[", cursor);
    if (labelStart === -1) {
      result += markdown.slice(cursor);
      break;
    }

    const labelEnd = markdown.indexOf("]", labelStart + 1);
    const isImageReference = labelStart > 0 && markdown[labelStart - 1] === "!";
    if (isImageReference || labelEnd === -1 || markdown[labelEnd + 1] !== "(") {
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

function findMarkdownDestinationEnd(markdown: string, startIndex: number): number {
  let parenthesesDepth = 0;

  for (let index = startIndex; index < markdown.length; index += 1) {
    const character = markdown[index];
    if (character === "\\") {
      index += 1;
      continue;
    }

    if (character === "(") {
      parenthesesDepth += 1;
      continue;
    }

    if (character === ")") {
      if (parenthesesDepth === 0) {
        return index;
      }
      parenthesesDepth -= 1;
    }
  }

  return -1;
}
