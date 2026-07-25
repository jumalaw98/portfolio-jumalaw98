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
    markdown
      // Remove markdown image references
      .replace(/!\[.*?\]\(.*?\)/g, "")
      // Unwrap link syntax: [text](url) → text
      .replace(/\[([^\[\]]+)\]\([^()\s]+\)/g, "$1")
      // Remove code-fence markers but keep content
      .replace(/```\w*/g, "")
      // Strip frontmatter if any slipped through
      .replace(/^---[\s\S]*?---\n/, "")
      .trim()
  );
}
