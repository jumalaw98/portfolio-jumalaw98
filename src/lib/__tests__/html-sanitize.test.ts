import { describe, it, expect } from "vitest";
import { sanitizeExternalHtml, html } from "@/lib/html-sanitize";

describe("sanitizeExternalHtml — XSS prevention", () => {
  it("removes <script> tags entirely", () => {
    const unsanitizedHtml = html`<p>Hello</p>
      <script>
        alert("xss");
      </script>
      <p>World</p>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).not.toContain(html`<script>`);
    expect(clean).not.toContain(html`alert`);
    expect(clean).toContain(html`<p>Hello</p>`);
    expect(clean).toContain(html`<p>World</p>`);
  });

  it("removes onerror event handler", () => {
    const unsanitizedHtml = html`<img src="x" onerror="alert(1)" alt="test" />`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).not.toContain(html`onerror`);
    expect(clean).not.toContain(html`alert`);
  });

  it("removes onclick event handler", () => {
    const unsanitizedHtml = html`<p onclick="alert(1)">Click me</p>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).not.toContain(html`onclick`);
    expect(clean).toContain(html`Click me`);
  });

  it("removes javascript: URLs", () => {
    const unsanitizedHtml = html`<a href="javascript:alert(1)">Click</a>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).not.toContain(html`javascript:`);
    expect(clean).not.toContain(html`alert`);
  });

  it("removes data: URIs from links (but allows them in images)", () => {
    const unsanitizedHtml = html`<a href="data:text/html,<script>alert(1)</script>">Click</a>`;
    const cleanLink = sanitizeExternalHtml(unsanitizedHtml);
    expect(cleanLink).not.toContain(html`data:`);

    const unsanitizedImg = html`<img src="data:image/png;base64,AAAA" alt="test" />`;
    const cleanImg = sanitizeExternalHtml(unsanitizedImg);
    expect(cleanImg).toContain(html`data:image/png;base64,`);
  });

  it("removes iframe elements", () => {
    const unsanitizedHtml = html`<p>Before</p>
      <iframe src="https://evil.com"></iframe>
      <p>After</p>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).not.toContain(html`&lt;iframe`);
    expect(clean).not.toContain(html`<iframe`);
    expect(clean).toContain(html`Before`);
    expect(clean).toContain(html`After`);
  });

  it("removes form elements", () => {
    const unsanitizedHtml = html`<form action="https://evil.com">
      <input type="text" name="x" />
    </form>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).not.toContain(html`&lt;form`);
    expect(clean).not.toContain(html`&lt;input`);
    expect(clean).not.toContain(html`<form`);
    expect(clean).not.toContain(html`<input`);
  });

  it("removes SVG elements that could contain scripts", () => {
    const unsanitizedHtml = html`<svg onload="alert(1)"><circle r="50" cx="50" cy="50" /></svg>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).not.toContain(html`&lt;svg`);
    expect(clean).not.toContain(html`<svg`);
    expect(clean).not.toContain(html`onload`);
  });

  it("removes style-based attacks", () => {
    const unsanitizedHtml = html`<p style="background: url(javascript:alert(1))">Styled</p>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).not.toContain(html`style`);
    expect(clean).toContain(html`Styled`);
  });

  it("removes untrusted target and rel attributes from links", () => {
    const clean = sanitizeExternalHtml(
      html`<a href="https://example.com" target="_blank" rel="opener">Link</a>`,
    );
    expect(clean).not.toContain(html`target=`);
    expect(clean).not.toContain(html`rel=`);
  });

  it("strips all event handler attributes", () => {
    const unsanitizedHtml = html`<div onmouseover="alert(1)" onfocus="alert(1)" onload="alert(1)">
      Content
    </div>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).not.toContain(html`onmouseover`);
    expect(clean).not.toContain(html`onfocus`);
    expect(clean).not.toContain(html`onload`);
    expect(clean).toContain(html`Content`);
  });

  it("preserves safe article HTML (headings, paragraphs, links, code, images)", () => {
    const safe = html`
      <h2 id="section-1">Section Title</h2>
      <p>This is a <strong>bold</strong> and <em>italic</em> paragraph.</p>
      <a href="https://example.com" title="Example" target="_blank" rel="noopener noreferrer"
        >Link</a
      >
      <img src="https://images.example.com/photo.jpg" alt="Photo" loading="lazy" />
      <pre><code class="language-typescript">const x = 1;</code></pre>
      <blockquote><p>Quoted text</p></blockquote>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      <ol>
        <li>First</li>
        <li>Second</li>
      </ol>
      <table>
        <thead>
          <tr>
            <th>Col A</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Val A</td>
          </tr>
        </tbody>
      </table>
    `;
    const clean = sanitizeExternalHtml(safe);
    expect(clean).toContain(html`<h2`);
    expect(clean).toContain(html`<p></p>`);
    expect(clean).toContain(html`<strong></strong>`);
    expect(clean).toContain(html`<em></em>`);
    expect(clean).toContain(html`<a`);
    expect(clean).toContain(html`<img`);
    expect(clean).toContain(html`<pre></pre>`);
    expect(clean).toContain(html`<code`);
    expect(clean).toContain(html`<blockquote></blockquote>`);
    expect(clean).toContain(html`<ul></ul>`);
    expect(clean).toContain(html`<ol></ol>`);
    expect(clean).toContain(html`<table></table>`);
    expect(clean).toContain(html`https://example.com`);
    expect(clean).toContain(html`https://images.example.com/photo.jpg`);
  });

  it("handles empty input gracefully", () => {
    expect(sanitizeExternalHtml("")).toBe("");
  });

  it("handles malformed HTML gracefully", () => {
    const unsanitizedHtml = html`<p>Unclosed <strong>bold <em>mixed</p>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).toContain(html`<p></p>`);
    expect(clean).toContain(html`Unclosed`);
  });

  it("removes protocol-relative URLs in links", () => {
    const unsanitizedHtml = html`<a href="//evil.com/malicious">Click</a>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).not.toContain(html`//evil.com`);
  });

  it("preserves id attributes on headings for table of contents", () => {
    const unsanitizedHtml = html`<h2 id="my-section">My Section</h2>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).toContain(html`id="my-section"`);
  });

  it("preserves class attributes on code blocks for syntax highlighting", () => {
    const unsanitizedHtml = html`<pre><code class="language-typescript">const x = 1;</code></pre>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).toContain(html`class="language-typescript"`);
  });

  it("preserves colgroup and col elements for table structure", () => {
    const unsanitizedHtml = html`<table>
      <colgroup>
        <col span="2" />
      </colgroup>
      <tr>
        <td>A</td>
        <td>B</td>
      </tr>
    </table>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).toContain(html`<colgroup></colgroup>`);
    expect(clean).toContain(html`<col`);
  });

  it("preserves figure and figcaption for image captions", () => {
    const unsanitizedHtml = html`<figure>
      <img src="https://example.com/img.jpg" alt="Alt" />
      <figcaption>Caption</figcaption>
    </figure>`;
    const clean = sanitizeExternalHtml(unsanitizedHtml);
    expect(clean).toContain(html`<figure></figure>`);
    expect(clean).toContain(html`<figcaption></figcaption>`);
    expect(clean).toContain(html`Caption`);
  });
});
