import { describe, it, expect } from "vitest";
import { sanitizeExternalHtml } from "@/lib/html-sanitize";

describe("sanitizeExternalHtml — XSS prevention", () => {
  it("removes <script> tags entirely", () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("alert");
    expect(clean).toContain("<p>Hello</p>");
    expect(clean).toContain("<p>World</p>");
  });

  it("removes onerror event handler", () => {
    const dirty = '<img src="x" onerror="alert(1)" alt="test">';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("alert");
  });

  it("removes onclick event handler", () => {
    const dirty = '<p onclick="alert(1)">Click me</p>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).not.toContain("onclick");
    expect(clean).toContain("Click me");
  });

  it("removes javascript: URLs", () => {
    const dirty = '<a href="javascript:alert(1)">Click</a>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).not.toContain("javascript:");
    expect(clean).not.toContain("alert");
  });

  it("removes data: URIs from links (but allows them in images)", () => {
    const dirtyLink = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
    const cleanLink = sanitizeExternalHtml(dirtyLink);
    expect(cleanLink).not.toContain("data:");

    const dirtyImg = '<img src="data:image/png;base64,AAAA" alt="test">';
    const cleanImg = sanitizeExternalHtml(dirtyImg);
    expect(cleanImg).toContain("data:image/png;base64,");
  });

  it("removes iframe elements", () => {
    const dirty = '<p>Before</p><iframe src="https://evil.com"></iframe><p>After</p>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).not.toContain("<iframe>");
    expect(clean).toContain("Before");
    expect(clean).toContain("After");
  });

  it("removes form elements", () => {
    const dirty = '<form action="https://evil.com"><input type="text" name="x"></form>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).not.toContain("<form>");
    expect(clean).not.toContain("<input>");
  });

  it("removes SVG elements that could contain scripts", () => {
    const dirty = '<svg onload="alert(1)"><circle r="50" cx="50" cy="50"/></svg>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).not.toContain("<svg>");
    expect(clean).not.toContain("onload");
  });

  it("removes style-based attacks", () => {
    const dirty = '<p style="background: url(javascript:alert(1))">Styled</p>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).not.toContain("style");
    expect(clean).toContain("Styled");
  });

  it("strips all event handler attributes", () => {
    const dirty = '<div onmouseover="alert(1)" onfocus="alert(1)" onload="alert(1)">Content</div>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).not.toContain("onmouseover");
    expect(clean).not.toContain("onfocus");
    expect(clean).not.toContain("onload");
    expect(clean).toContain("Content");
  });

  it("preserves safe article HTML (headings, paragraphs, links, code, images)", () => {
    const safe = `
      <h2 id="section-1">Section Title</h2>
      <p>This is a <strong>bold</strong> and <em>italic</em> paragraph.</p>
      <a href="https://example.com" title="Example" target="_blank" rel="noopener noreferrer">Link</a>
      <img src="https://images.example.com/photo.jpg" alt="Photo" loading="lazy">
      <pre><code class="language-typescript">const x = 1;</code></pre>
      <blockquote><p>Quoted text</p></blockquote>
      <ul><li>Item 1</li><li>Item 2</li></ul>
      <ol><li>First</li><li>Second</li></ol>
      <table><thead><tr><th>Col A</th></tr></thead><tbody><tr><td>Val A</td></tr></tbody></table>
    `;
    const clean = sanitizeExternalHtml(safe);
    expect(clean).toContain("<h2");
    expect(clean).toContain("<p>");
    expect(clean).toContain("<strong>");
    expect(clean).toContain("<em>");
    expect(clean).toContain("<a");
    expect(clean).toContain("<img");
    expect(clean).toContain("<pre>");
    expect(clean).toContain("<code");
    expect(clean).toContain("<blockquote>");
    expect(clean).toContain("<ul>");
    expect(clean).toContain("<ol>");
    expect(clean).toContain("<table>");
    expect(clean).toContain("https://example.com");
    expect(clean).toContain("https://images.example.com/photo.jpg");
  });

  it("handles empty input gracefully", () => {
    expect(sanitizeExternalHtml("")).toBe("");
  });

  it("handles malformed HTML gracefully", () => {
    const dirty = "<p>Unclosed <strong>bold <em>mixed</p>";
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).toContain("<p>");
    expect(clean).toContain("Unclosed");
  });

  it("removes protocol-relative URLs in links", () => {
    const dirty = '<a href="//evil.com/malicious">Click</a>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).not.toContain("//evil.com");
  });

  it("preserves id attributes on headings for table of contents", () => {
    const dirty = '<h2 id="my-section">My Section</h2>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).toContain('id="my-section"');
  });

  it("preserves class attributes on code blocks for syntax highlighting", () => {
    const dirty = '<pre><code class="language-typescript">const x = 1;</code></pre>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).toContain('class="language-typescript"');
  });

  it("preserves colgroup and col elements for table structure", () => {
    const dirty = '<table><colgroup><col span="2"></colgroup><tr><td>A</td><td>B</td></tr></table>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).toContain("<colgroup>");
    expect(clean).toContain("<col");
  });

  it("preserves figure and figcaption for image captions", () => {
    const dirty =
      '<figure><img src="https://example.com/img.jpg" alt="Alt"><figcaption>Caption</figcaption></figure>';
    const clean = sanitizeExternalHtml(dirty);
    expect(clean).toContain("<figure>");
    expect(clean).toContain("<figcaption>");
    expect(clean).toContain("Caption");
  });
});
