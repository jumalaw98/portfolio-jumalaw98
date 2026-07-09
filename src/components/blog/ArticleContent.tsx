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

interface ArticleContentProps {
  html: string;
}

/**
 * Renders Hashnode's `content.html` and applies Prism syntax highlighting to
 * any <pre><code class="language-xxx"> blocks after mount. Hashnode's HTML
 * export already uses standard `language-*` class names, so no HTML
 * transformation is needed — just highlighting.
 */
export function ArticleContent({ html }: ArticleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      Prism.highlightAllUnder(containerRef.current);
    }
  }, [html]);

  return (
    <div
      ref={containerRef}
      id="article-content"
      className="prose-article"
      // Content originates from our own Hashnode publication, not user input.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
