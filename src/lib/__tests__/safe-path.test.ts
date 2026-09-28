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

let root: string;
let base: string;
let outside: string;
let outsideRoot: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "safe-path-"));
  base = join(root, "content");
  outside = join(root, "outside");
  // A second temp directory OUTSIDE `root`, so a symlinked content root can be
  // tested against `root` as the trusted (repository-root) boundary.
  outsideRoot = mkdtempSync(join(tmpdir(), "safe-path-outside-root-"));

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
  // A symlinked content root inside `root` that points outside `root` —
  // simulates a symlinked src/content/blog.
  symlinkSync(outsideRoot, join(root, "linked-root"));
});

afterAll(() => {
  rmSync(resolve(base, ".."), { recursive: true, force: true });
  rmSync(outsideRoot, { recursive: true, force: true });
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
    // Compare against the canonical realpath (not the lexical join): on hosts
    // where the temp root sits behind a symlink (e.g. macOS /tmp →
    // /private/tmp) the helper returns the resolved realpath.
    expect(assertRealPathWithinBase(base, join(base, "a.mdx"))).toBe(
      realpathSync(join(base, "a.mdx")),
    );
  });

  it("rejects a symlink that points outside the base directory", () => {
    expect(() => assertRealPathWithinBase(base, join(base, "linked.mdx"))).toThrow(/outside/);
  });

  it("rejects a content root that is a symlink pointing outside the trusted base", () => {
    // Simulates a symlinked src/content/blog: the walk in listFilesWithinBase
    // computes its containment boundary from realpath(baseDir), so the content
    // scripts validate the resolved root against the repository root (as this
    // call does) before listing — otherwise the link target becomes its own
    // trusted boundary.
    expect(() => assertRealPathWithinBase(root, join(root, "linked-root"))).toThrow(/outside/);
  });

  it("returns the real path for a content root inside the trusted base", () => {
    expect(assertRealPathWithinBase(root, base)).toBe(realpathSync(base));
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
    // realpath(outside) so the comparison is meaningful on hosts where the
    // temp root sits behind a symlink (e.g. macOS /tmp → /private/tmp).
    expect(files.some((file) => realpathSync(file).startsWith(realpathSync(outside)))).toBe(false);
  });

  it("does not return files reached through a symlinked directory", () => {
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
