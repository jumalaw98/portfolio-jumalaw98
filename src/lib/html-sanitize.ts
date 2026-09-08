/**
 * Server-side HTML sanitization for external content.
 *
 * Sanitize untrusted HTML (e.g. Hashnode RSS articles) before it reaches the
 * DOM via dangerouslySetInnerHTML. Uses sanitize-html — a pure string
 * sanitizer that works in Node.js without browser DOM APIs.
 *
 * Policy: allow common article elements (headings, paragraphs, lists, code
 * blocks, links, images, tables, inline formatting) while stripping scripts,
 * event handlers, iframes, forms, and dangerous URI schemes.
 */

import sanitize from "sanitize-html";

const ALLOWED_TAGS = [
  // Headings
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  // Block
  "p",
  "br",
  "hr",
  "blockquote",
  "pre",
  "div",
  "figure",
  "figcaption",
  // Inline
  "a",
  "span",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "code",
  "kbd",
  "mark",
  "sub",
  "sup",
  // Lists
  "ul",
  "ol",
  "li",
  // Images
  "img",
  // Tables
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "colgroup",
  "col",
  // Media
  "picture",
  "source",
];

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
  code: ["class"],
  pre: ["class"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan", "scope"],
  span: ["class"],
  div: ["class"],
  p: ["class"],
  h1: ["id"],
  h2: ["id"],
  h3: ["id"],
  h4: ["id"],
  h5: ["id"],
  h6: ["id"],
  ul: ["class"],
  ol: ["class"],
  li: ["class"],
  blockquote: ["class"],
  figure: ["class"],
  figcaption: ["class"],
  table: ["class"],
  source: ["srcset", "type", "media"],
  picture: [],
};

/**
 * Sanitize HTML content from external sources (Hashnode, CMS, etc.).
 *
 * @param dirty - Untrusted HTML string
 * @returns Sanitized HTML safe for rendering via dangerouslySetInnerHTML
 */
export function sanitizeExternalHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto", "tel"],
      img: ["http", "https", "data"],
    },
    allowedStyles: {},
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
  });
}
