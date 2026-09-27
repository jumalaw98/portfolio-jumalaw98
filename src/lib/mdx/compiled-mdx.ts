/**
 * Trust boundary for Velite-compiled MDX.
 *
 * Velite (like every MDX compiler) emits a *function body* string that must be
 * evaluated before React can render it. Evaluating a string is inherently
 * powerful, so the code that reaches the evaluator is constrained here:
 *
 *   - `CompiledMdxCode` is a nominal brand. Only {@link asCompiledMdxCode} may
 *     produce it, and it is only called on build output loaded from Velite
 *     (`.velite/posts.json`) — the compiled form of the MDX files committed to
 *     this repository.
 *   - {@link asCompiledMdxCode} rejects anything that is not a plausible MDX
 *     function body, so a corrupted or substituted artifact fails closed
 *     instead of being evaluated.
 *
 * This is an artifact-integrity check, NOT a sandbox: it does not make
 * arbitrary JavaScript safe to evaluate, and it is not a substitute for the
 * branded type. See docs/security.md → "MDX evaluation".
 */

/** Largest compiled body we are willing to evaluate (defence against a runaway artifact). */
const MAX_COMPILED_MDX_BYTES = 5 * 1024 * 1024;

/**
 * Marker emitted by the MDX compiler for function-body output: the runtime
 * (`{ Fragment, jsx, jsxs }`) is read from `arguments[0]`.
 *
 * If Velite or MDX changes this output contract, update this constant — the
 * check is intentionally strict so a change is caught at build/test time rather
 * than silently weakening the boundary.
 */
const MDX_FUNCTION_BODY_MARKER = "arguments[0]";

declare const compiledMdxBrand: unique symbol;

interface CompiledMdxCodeBrand {
  readonly [compiledMdxBrand]: "CompiledMdxCode";
}

/** Compiled MDX function body that is safe to hand to the evaluator. */
export type CompiledMdxCode = string & CompiledMdxCodeBrand;

/**
 * Validate and brand a value as compiled MDX code.
 *
 * @param raw - Candidate value (typically `body` from a Velite post)
 * @returns The branded code, or `null` when the value is not a plausible
 *          compiled MDX artifact
 */
export function asCompiledMdxCode(raw: unknown): CompiledMdxCode | null {
  if (typeof raw !== "string") return null;

  const code = raw.trim();
  if (code.length === 0 || code.length > MAX_COMPILED_MDX_BYTES) return null;
  if (!code.includes(MDX_FUNCTION_BODY_MARKER)) return null;

  return code as CompiledMdxCode;
}
