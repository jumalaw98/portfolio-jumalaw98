import { describe, it, expect } from "vitest";
import { asCompiledMdxCode } from "@/lib/mdx/compiled-mdx";

/**
 * Security regression tests for the compiled-MDX trust boundary.
 *
 * The evaluator in src/components/blog/MdxContent.tsx only accepts
 * `CompiledMdxCode`, which `asCompiledMdxCode()` is the sole producer of. These
 * tests pin the runtime marker check: strings without the expected MDX
 * function-body marker are never branded, so a corrupted or substituted build
 * artifact fails closed instead of being evaluated. (The check rejects strings
 * lacking that marker — it is not a general JavaScript integrity check, and
 * JavaScript that merely happens to contain the marker is still branded. The
 * brand itself is enforced by `npm run typecheck`.)
 */

/** Shape emitted by Velite's MDX compiler (function-body output). */
const VELITE_OUTPUT =
  'const{Fragment:e,jsx:n,jsxs:t}=arguments[0];function _createMdxContent(i){return n("p",{children:"hi"})}';

describe("asCompiledMdxCode", () => {
  it("brands real Velite output", () => {
    const code = asCompiledMdxCode(VELITE_OUTPUT);
    expect(code).toBe(VELITE_OUTPUT);
  });

  it("trims surrounding whitespace", () => {
    expect(asCompiledMdxCode(`\n  ${VELITE_OUTPUT}\n`)).toBe(VELITE_OUTPUT);
  });

  it("rejects non-string values", () => {
    for (const value of [null, undefined, 42, true, {}, [], VELITE_OUTPUT.length]) {
      expect(asCompiledMdxCode(value)).toBeNull();
    }
  });

  it("rejects empty and whitespace-only strings", () => {
    expect(asCompiledMdxCode("")).toBeNull();
    expect(asCompiledMdxCode("   \n\t ")).toBeNull();
  });

  it("rejects JavaScript that is not compiled MDX output", () => {
    // Rejected because it lacks the MDX function-body marker, not because the
    // check is a sandbox — see the module docs.
    expect(asCompiledMdxCode("globalThis.__pwned = true;")).toBeNull();
    expect(asCompiledMdxCode("export default function () { return null; }")).toBeNull();
    expect(asCompiledMdxCode("require('node:child_process').execSync('id');")).toBeNull();
  });

  it("rejects oversized artifacts", () => {
    // ASCII: 5 MiB of characters is also 5 MiB of UTF-8 bytes, and the
    // marker-bearing prefix pushes it over the limit.
    const oversized = `${VELITE_OUTPUT}${"a".repeat(5 * 1024 * 1024)}`;
    expect(asCompiledMdxCode(oversized)).toBeNull();
  });

  it("rejects artifacts over the byte limit even when the character count is under it", () => {
    // The limit is measured in UTF-8 bytes while `code.length` counts UTF-16
    // code units: a marker-bearing artifact heavy in multibyte characters can
    // exceed 5 MiB of bytes while staying below 5,242,880 characters.
    const multibyte = `${VELITE_OUTPUT}${"é".repeat(3 * 1024 * 1024)}`;
    // 3,145,728 characters (< 5 MiB) but 6,291,456+ bytes (> 5 MiB).
    expect(multibyte.length).toBeLessThan(5 * 1024 * 1024);
    expect(asCompiledMdxCode(multibyte)).toBeNull();
  });

  it("brands multibyte artifacts under the byte limit", () => {
    // 1 MiB of characters, 2 MiB of UTF-8 bytes — comfortably under the limit,
    // so multibyte content is not wrongly rejected.
    const code = asCompiledMdxCode(`${VELITE_OUTPUT}${"é".repeat(1024 * 1024)}`);
    expect(code).not.toBeNull();
  });
});
