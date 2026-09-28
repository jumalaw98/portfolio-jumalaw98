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

/**
 * Nominal brand for strings that have been through {@link sanitizeExternalHtml}.
 *
 * Rendering HTML with `dangerouslySetInnerHTML` is only safe when the value is
 * sanitized. Typing the payload as `SanitizedHtml` makes that requirement
 * machine-checked: components such as `ArticleContent` accept `SanitizedHtml`,
 * so an unsanitized string is a compile error rather than a silent XSS.
 *
 * `sanitizeExternalHtml()` is the only producer of this type.
 */
declare const sanitizedHtmlBrand: unique symbol;

interface SanitizedHtmlBrand {
  readonly [sanitizedHtmlBrand]: "SanitizedHtml";
}

export type SanitizedHtml = string & SanitizedHtmlBrand;

/**
 * Template literal tag to explicitly mark a *literal* string as HTML content.
 *
 * IMPORTANT: this helper performs no sanitization and returns a plain `string`.
 * It exists so that test fixtures (and static markup) read as HTML rather than
 * as an opaque string. Never use it to render untrusted input — pass untrusted
 * markup through {@link sanitizeExternalHtml} instead.
 *
 * @param strings - Template literal strings
 * @param values - Interpolated values
 * @returns The concatenated string
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      // Template literal coercion is equivalent to String() but avoids the
      // security/detect-object-injection rule false positive. The actual XSS
      // sanitization happens in sanitizeExternalHtml() which must be called on
      // the result before rendering via dangerouslySetInnerHTML.
      result += `${values[i]}`;
    }
  }
  return result;
}

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
  // External article links render in the current tab. Keeping `target` and
  // `rel` out of the policy prevents untrusted HTML from retaining opener
  // access through a crafted `target="_blank" rel="opener"` combination.
  a: ["href", "title"],
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
 * This is the single trust boundary for HTML that is later rendered with
 * `dangerouslySetInnerHTML`. Anything not passed through here is rendered as
 * text by React.
 *
 * @param dirty - Untrusted HTML string
 * @returns Sanitized HTML, branded as `SanitizedHtml` so it can be handed to
 *          the components that render raw HTML
 */
export function sanitizeExternalHtml(dirty: string): SanitizedHtml {
  // sanitize-html is typed as returning `string`; only this function may claim
  // the sanitized brand, which is exactly why the cast lives here.
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
  }) as SanitizedHtml;
}

/**
 * Canonical empty value for content sources that carry no HTML (for example
 * MDX posts, which are rendered from compiled code instead of HTML).
 */
export const EMPTY_SANITIZED_HTML: SanitizedHtml = sanitizeExternalHtml("");
