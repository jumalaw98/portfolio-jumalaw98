import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  assertRealPathWithinBase,
  assertWithinBase,
  isWithinBase,
  listFilesWithinBase,
} from "@/lib/safe-path";

/**
 * Security regression tests for the path-containment helpers used by the
 * content scripts (scripts/generate-summaries.ts etc.).
 *
 * These cover the two escapes that matter for those scripts:
 *   - `../` traversal / absolute paths (lexical)
 *   - symlinks pointing outside the trusted base directory
 */

let base: string;
let outside: string;

beforeAll(() => {
  const root = mkdtempSync(join(tmpdir(), "safe-path-"));
  base = join(root, "content");
  outside = join(root, "outside");

  mkdirSync(base, { recursive: true });
  mkdirSync(outside, { recursive: true });
  mkdirSync(join(base, "nested"), { recursive: true });

  writeFileSync(join(base, "a.mdx"), "# a");
  writeFileSync(join(base, "nested", "b.mdx"), "# b");
  writeFileSync(join(base, "notes.txt"), "not a post");
  writeFileSync(join(outside, "secret.mdx"), "# secret");

  // A symlinked file inside the content tree that points outside it.
  symlinkSync(join(outside, "secret.mdx"), join(base, "linked.mdx"));
  // A symlinked directory inside the content tree that points outside it.
  symlinkSync(outside, join(base, "linked-dir"));
});

afterAll(() => {
  rmSync(resolve(base, ".."), { recursive: true, force: true });
});

describe("isWithinBase", () => {
  it("accepts the base directory itself and nested paths", () => {
    expect(isWithinBase(base, base)).toBe(true);
    expect(isWithinBase(base, join(base, "nested", "b.mdx"))).toBe(true);
  });

  it("rejects traversal, absolute paths outside and sibling-prefix paths", () => {
    expect(isWithinBase(base, "../../../../etc/passwd")).toBe(false);
    expect(isWithinBase(base, "/etc/passwd")).toBe(false);
    expect(isWithinBase(base, join(base, "..", "outside", "secret.mdx"))).toBe(false);
    // `/content-evil` must not be treated as inside `/content`.
    expect(isWithinBase(base, `${base}-evil/file.mdx`)).toBe(false);
  });
});

describe("assertWithinBase", () => {
  it("returns the resolved path for a safe candidate", () => {
    expect(assertWithinBase(base, join(base, "nested", "..", "a.mdx"))).toBe(join(base, "a.mdx"));
  });

  it("throws for path traversal and absolute escapes", () => {
    expect(() => assertWithinBase(base, "../../../../etc/passwd")).toThrow(/outside/);
    expect(() => assertWithinBase(base, "/etc/passwd")).toThrow(/outside/);
  });
});

describe("assertRealPathWithinBase", () => {
  it("accepts a real file inside the base directory", () => {
    expect(assertRealPathWithinBase(base, join(base, "a.mdx"))).toBe(join(base, "a.mdx"));
  });

  it("rejects a symlink that points outside the base directory", () => {
    expect(() => assertRealPathWithinBase(base, join(base, "linked.mdx"))).toThrow(/outside/);
  });
});

describe("listFilesWithinBase", () => {
  it("returns only real .mdx files inside the base directory", () => {
    const files = listFilesWithinBase({
      baseDir: base,
      pattern: "**/*.mdx",
      extension: ".mdx",
    });

    expect(files).toEqual([join(base, "a.mdx"), join(base, "nested", "b.mdx")]);
  });

  it("never returns a symlinked file that escapes the base directory", () => {
    const files = listFilesWithinBase({
      baseDir: base,
      pattern: "**/*.mdx",
      extension: ".mdx",
    });

    expect(files).not.toContain(join(base, "linked.mdx"));
    expect(files.some((file) => realpathSync(file).startsWith(outside))).toBe(false);
  });

  it("does not descend into symlinked directories", () => {
    const files = listFilesWithinBase({
      baseDir: base,
      pattern: "**/*.mdx",
      extension: ".mdx",
    });

    expect(files.some((file) => file.includes("linked-dir"))).toBe(false);
  });

  it("filters by extension", () => {
    const files = listFilesWithinBase({
      baseDir: base,
      pattern: "**/*",
      extension: ".txt",
    });

    expect(files).toEqual([join(base, "notes.txt")]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(
      listFilesWithinBase({ baseDir: base, pattern: "**/*.nothing", extension: ".mdx" }),
    ).toEqual([]);
  });
});
