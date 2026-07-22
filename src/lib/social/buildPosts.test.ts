import { describe, it, expect } from "vitest";
import { buildXPost, buildLinkedInPost } from "./buildPosts";

describe("buildXPost", () => {
  it("keeps total output under 280 chars for a hook within budget", () => {
    const url = "https://jumalaw98.vercel.app/blog/welcome-to-the-new-blog";
    const result = buildXPost({ hook: "A short hook", body: null }, url);
    expect(result.length).toBeLessThanOrEqual(280);
    expect(result).toContain(url);
  });

  it("truncates a very long hook and appends the URL", () => {
    const url = "https://example.com/blog/my-very-long-post-title";
    const longHook = "A very long hook indeed ".repeat(30);
    const result = buildXPost({ hook: longHook, body: null }, url);
    // The hook is truncated to X_TEXT_BUDGET (256) before the URL is appended.
    // The total can exceed 280 if the actual URL is longer than 23 chars (t.co
    // shortener) — the function only controls the hook portion.
    expect(result).toContain(url);
    // Verify truncation happened: the original multi-repeated text is gone
    expect(result.length).toBeLessThan(longHook.length + url.length);
    // The hook portion is at most 256 chars, so the result is hook + space + url
    const urlEnd = result.lastIndexOf(url);
    expect(urlEnd).toBeGreaterThan(0);
    expect(urlEnd + url.length).toBe(result.length); // url is at the end
    const hookPortion = result.slice(0, urlEnd - 1);
    expect(hookPortion.length).toBeLessThanOrEqual(256);
  });

  it("does not cut mid-word when truncating a long hook", () => {
    const url = "https://example.com/blog/post";
    const words = Array.from({ length: 50 }, (_, i) => `word${i}`);
    const longHook = words.join(" ");
    const result = buildXPost({ hook: longHook, body: null }, url);

    // The hook portion (before the URL) should end with "…"
    // because truncation replaces the last space with an ellipsis
    const hookPortion = result.slice(0, result.indexOf(url) - 1);
    expect(hookPortion).toMatch(/…$/);

    // Verify the truncated hook is at most X_TEXT_BUDGET chars (excluding the
    // final "…" that replaced a space)
    expect(hookPortion.length).toBeLessThanOrEqual(256);
  });

  it("includes the full URL in the output", () => {
    const url = "https://example.com/blog/test-post";
    const result = buildXPost({ hook: "Check this out", body: null }, url);
    expect(result).toContain(url);
    expect(result).toMatch(new RegExp(url + "$"));
  });
});

describe("buildLinkedInPost", () => {
  it("starts with the hook text when body is present", () => {
    const summary = { hook: "Lead hook sentence here", body: "Elaboration body text" };
    const url = "https://example.com/blog/post";
    const result = buildLinkedInPost(summary, url);

    const lines = result.split("\n");
    expect(lines[0]).toBe(summary.hook);
    expect(result.indexOf(summary.hook)).toBe(0);
  });

  it("includes a blank line then body when body is present", () => {
    const summary = { hook: "Hook text", body: "Body text here" };
    const url = "https://example.com/blog/post";
    const result = buildLinkedInPost(summary, url);

    const lines = result.split("\n");
    expect(lines[0]).toBe("Hook text");
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe("Body text here");
    expect(lines[3]).toBe("");
    expect(lines[lines.length - 1]).toBe(url);
  });

  it("omits the body section when body is null", () => {
    const summary = { hook: "Just a hook", body: null as string | null };
    const url = "https://example.com/blog/post";
    const result = buildLinkedInPost(summary, url);

    const lines = result.split("\n");
    expect(lines[0]).toBe("Just a hook");
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe(url);
    expect(lines).toHaveLength(3);
  });
});
