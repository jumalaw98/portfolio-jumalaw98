"use client";

import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-python";
import "prismjs/components/prism-docker";
import type { SanitizedHtml } from "@/lib/html-sanitize";

interface ArticleContentProps {
  /**
   * Article HTML. Typed as `SanitizedHtml`, so this component cannot be handed
   * an unsanitized string: the value must come from `sanitizeExternalHtml()`
   * (see src/lib/hashnode/posts.ts and src/content/blog-placeholder.ts).
   */
  readonly html: SanitizedHtml;
  /**
   * Stable identity of the rendered document (the post slug).
   *
   * Used purely as the re-highlight trigger below, so that post-render
   * highlighting never needs the HTML payload to flow through the effect.
   */
  readonly contentId: string;
}

/**
 * Renders Hashnode's `content.html` and applies Prism syntax highlighting to
 * any `<pre><code class="language-xxx">` blocks after mount. Hashnode's HTML
 * export already uses standard `language-*` class names, so no HTML
 * transformation is needed — just highlighting.
 *
 * SECURITY: the `html` prop is sanitized server-side by
 * `sanitizeExternalHtml()` before reaching this client component, and the
 * `SanitizedHtml` type on the prop enforces that at compile time. Do NOT change
 * the prop type to `string` — that is the security boundary.
 *
 * The effect below only reads the already-rendered DOM through `containerRef`
 * and rewrites code blocks with Prism (text-node based); it never injects HTML.
 */
export function ArticleContent({ html, contentId }: ArticleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    Prism.highlightAllUnder(container);
  }, [contentId]);

  return (
    <div
      ref={containerRef}
      id="article-content"
      className="prose-article"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
