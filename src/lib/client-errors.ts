/**
 * Client-side failure classification and minimised reporting.
 *
 * Client operations (form submission, clipboard access) fail for reasons that
 * need different handling:
 *
 *   - `offline`      — the request never left the browser (fetch rejects with a
 *                      TypeError). Expected operational failure; retrying is
 *                      meaningful.
 *   - `timeout`      — the request was aborted by a timeout/AbortSignal.
 *   - `unavailable`  — the browser refused the API (DOMException: Clipboard
 *                      permission denied, API not exposed on an insecure
 *                      origin, …). Expected; a fallback path is meaningful.
 *   - `unexpected`   — anything else, i.e. a bug.
 *
 * Reporting rules (deliberately stricter than `console.error(error)`):
 *   - only the failure *kind* and the error *name* are emitted, never the raw
 *     message, payload or response body, so no request body, URL or server
 *     detail can leak into the UI or a shared console/session recording;
 *   - nothing is emitted in production builds at all.
 *
 * Pure module (no React, no DOM APIs beyond the globally available
 * `DOMException`/`TypeError`), so it runs on the server and in the browser and
 * is unit-testable under the Node test environment.
 */

export type ClientFailureKind = "offline" | "timeout" | "unavailable" | "unexpected";

/** Narrow an unknown rejection reason to a DOMException name. */
function domExceptionName(error: unknown): string | null {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name;
  }
  return null;
}

/** True for aborts raised by an `AbortSignal` or a provider timeout. */
function isAbortError(error: unknown): boolean {
  return (
    domExceptionName(error) === "AbortError" || (error as { name?: unknown })?.name === "AbortError"
  );
}

/**
 * Classify a rejection reason from a client-side operation.
 *
 * @param error - The caught value (from a `catch (error)` binding)
 * @returns A coarse failure kind that is safe to act on
 */
export function classifyClientError(error: unknown): ClientFailureKind {
  if (isAbortError(error)) return "timeout";
  // `fetch` rejects with a TypeError when the request could not be made at all.
  if (error instanceof TypeError) return "offline";
  if (domExceptionName(error) !== null) return "unavailable";
  return "unexpected";
}

/**
 * Build the log line for a client-side failure. Never includes the raw error
 * message: only the operation, the failure kind and the error class name.
 *
 * @param context - Short operation identifier, e.g. `"contact.submit"`
 * @param error - The caught value
 * @returns A single-line, non-sensitive description
 */
export function describeClientFailure(context: string, error: unknown): string {
  const kind = classifyClientError(error);
  const name = error instanceof Error ? error.name : typeof error;
  return `[${context}] ${kind} (${name})`;
}

/**
 * Report a client-side failure to the console, in development only.
 *
 * @param context - Short operation identifier
 * @param error - The caught value
 */
export function reportClientFailure(context: string, error: unknown): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn(describeClientFailure(context, error));
}
