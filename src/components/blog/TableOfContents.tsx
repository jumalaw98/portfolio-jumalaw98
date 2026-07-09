"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Reads h2/h3 elements out of #article-content after it renders, rather than
 * depending on an unconfirmed Hashnode "tableOfContents" schema field — this
 * works regardless of API shape and always matches what's actually on screen.
 */
export function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const container = document.getElementById("article-content");
    if (!container) return;

    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h2, h3"),
    );

    // Reading the DOM once after mount to build the TOC — not a cascading
    // state update, just the standard "sync with an external system" case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(
      headings.map((h) => ({
        id: h.id,
        text: h.textContent ?? "",
        level: h.tagName === "H2" ? 2 : 3,
      })),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px" },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  if (items.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="sticky top-24">
      <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
        On this page
      </p>
      <ul className="mt-3 flex flex-col gap-2 border-l border-border pl-4 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "ml-3" : ""}>
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? "location" : undefined}
              className={cn(
                "block transition-colors",
                activeId === item.id
                  ? "font-medium text-brand-blue"
                  : "text-text-muted hover:text-brand-blue",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
