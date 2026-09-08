import { describe, it, expect } from "vitest";
import * as yaml from "js-yaml";

/**
 * Security tests for YAML frontmatter parsing.
 *
 * Verifies that:
 * - yaml.load() with JSON_SCHEMA rejects dangerous YAML tags
 * - Malformed YAML fails safely
 * - Standard MDX frontmatter parses correctly
 * - Unexpected object structures are handled
 */

const SAFE_OPTIONS = { schema: yaml.JSON_SCHEMA };

describe("YAML frontmatter parsing — security", () => {
  it("rejects !!js/function tags (code execution)", () => {
    const malicious = 'title: test\ncustom: !!js/function "function() { return process.exit(1); }"';
    expect(() => yaml.load(malicious, SAFE_OPTIONS)).toThrow();
  });

  it("rejects !!js/object tags (object injection)", () => {
    const malicious = 'title: test\ncustom: !!js/object "function prototype pollution() {}"';
    expect(() => yaml.load(malicious, SAFE_OPTIONS)).toThrow();
  });

  it("rejects !!js/regexp tags", () => {
    const malicious = "title: test\ncustom: !!js/regexp '.+'";
    expect(() => yaml.load(malicious, SAFE_OPTIONS)).toThrow();
  });

  it("rejects !!js/undefined tags", () => {
    const malicious = "title: test\ncustom: !!js/undefined";
    expect(() => yaml.load(malicious, SAFE_OPTIONS)).toThrow();
  });

  it("handles malformed YAML gracefully", () => {
    const malformed = "title: [unclosed\ncustom: {nested";
    // Should throw a YAML parse error, not crash with code execution
    expect(() => yaml.load(malformed, SAFE_OPTIONS)).toThrow();
  });

  it("parses standard MDX frontmatter correctly", () => {
    const frontmatter = [
      'title: "My Blog Post"',
      "slug: my-blog-post",
      "published: true",
      "date: 2026-01-01",
      "excerpt: A brief excerpt",
      "tags:",
      "  - typescript",
      "  - nextjs",
      "summary:",
      "  hook: A catchy hook",
      "  body: Some body text",
      "devToId: 12345",
      'bufferPostedAt: "2026-01-01T00:00:00.000Z"',
    ].join("\n");

    const result = yaml.load(frontmatter, SAFE_OPTIONS);
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
    expect(result).not.toBeNull();

    const fm = result as Record<string, unknown>;
    expect(fm.title).toBe("My Blog Post");
    expect(fm.slug).toBe("my-blog-post");
    expect(fm.published).toBe(true);
    expect(fm.excerpt).toBe("A brief excerpt");
    expect(Array.isArray(fm.tags)).toBe(true);
    expect(fm.tags).toEqual(["typescript", "nextjs"]);
  });

  it("handles null values in frontmatter", () => {
    const frontmatter = "title: test\nsummary:\nexcerpt: hello";
    const result = yaml.load(frontmatter, SAFE_OPTIONS);
    const fm = result as Record<string, unknown>;
    expect(fm.title).toBe("test");
    // JSON_SCHEMA converts bare null to empty string
    expect(fm.summary).toBe("");
    expect(fm.excerpt).toBe("hello");
  });

  it("handles empty frontmatter object", () => {
    const result = yaml.load("title: {}", SAFE_OPTIONS);
    const fm = result as Record<string, unknown>;
    // YAML {} is parsed as an empty object by JSON_SCHEMA
    expect(fm.title).toEqual({});
  });

  it("does not construct non-JSON types", () => {
    const frontmatter = "title: 2026-01-01";
    const result = yaml.load(frontmatter, SAFE_OPTIONS);
    const fm = result as Record<string, unknown>;
    // JSON_SCHEMA treats dates as strings, not Date objects
    expect(typeof fm.title).toBe("string");
  });

  it("handles YAML anchors safely", () => {
    const frontmatter = [
      "defaults: &defaults",
      "  author: test",
      "title: post",
      "merged:",
      "  <<: *defaults",
    ].join("\n");
    // YAML anchors are valid syntax — JSON_SCHEMA handles them correctly
    const result = yaml.load(frontmatter, SAFE_OPTIONS);
    expect(result).toBeDefined();
  });

  it("preserves type safety for boolean and number fields", () => {
    const frontmatter = "published: true\ncount: 42\nfloat: 3.14";
    const result = yaml.load(frontmatter, SAFE_OPTIONS);
    const fm = result as Record<string, unknown>;
    expect(fm.published).toBe(true);
    expect(typeof fm.published).toBe("boolean");
    expect(fm.count).toBe(42);
    expect(typeof fm.count).toBe("number");
    expect(fm.float).toBe(3.14);
  });
});
