import { describe, it, expect } from "vitest";
import { asCompiledMdxCode } from "@/lib/mdx/compiled-mdx";

/**
 * Security regression tests for the compiled-MDX trust boundary.
 *
 * The evaluator in src/components/blog/MdxContent.tsx only accepts
 * `CompiledMdxCode`, which `asCompiledMdxCode()` is the sole producer of. These
 * tests pin the runtime shape check: arbitrary JavaScript must not be branded,
 * so a corrupted or substituted build artifact fails closed instead of being
 * evaluated. (The brand itself is enforced by `npm run typecheck`.)
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
    const oversized = `${VELITE_OUTPUT}${"a".repeat(5 * 1024 * 1024)}`;
    expect(asCompiledMdxCode(oversized)).toBeNull();
  });
});
