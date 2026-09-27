/**
 * Contact-form error plumbing, shared by the client form and its unit tests.
 *
 * Security notes (both findings live here or consumed from here):
 *   - `parseApiErrors()` reads an untrusted response body. Keys are taken from a
 *     fixed allowlist and values must be non-empty strings, so unexpected
 *     properties (`__proto__`, `constructor`, …) and non-string payloads are
 *     ignored rather than propagated into form state.
 *   - No dynamic key is ever *written* into an object here: every assignment
 *     targets an explicitly named property, which removes the object-injection
 *     sink entirely instead of merely trusting the key's origin.
 *
 * Pure module: no React, no Node.js/DOM APIs, so it runs on the server and in
 * the browser.
 */

import type { ValidationError } from "@/lib/validation";

export type FieldName = "name" | "email" | "intent" | "message";

export type FieldErrors = Partial<Record<FieldName, string>>;

/**
 * Convert validation errors from the shared validator into a field-keyed map.
 *
 * @param errors - Errors produced by `validateContactForm()`
 * @returns Sparse map containing only the fields that failed
 */
export function errorsToMap(errors: ValidationError[]): FieldErrors {
  const map: FieldErrors = {};

  for (const error of errors) {
    // Explicit per-field assignment. `error.field` is a closed union produced by
    // our own validator, and a switch keeps every write statically addressable.
    switch (error.field) {
      case "name":
        map.name = error.message;
        break;
      case "email":
        map.email = error.message;
        break;
      case "intent":
        map.intent = error.message;
        break;
      case "message":
        map.message = error.message;
        break;
    }
  }

  return map;
}

/** True for values that are plain data records (arrays and null are rejected). */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Accept only non-empty string values; everything else is discarded. */
function readErrorMessage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim() === "" ? undefined : value;
}

/**
 * Extract field-level errors from an API error response body.
 *
 * @param body - Parsed (untrusted) response body
 * @returns Sparse map of field errors, or `null` when the body carries none
 */
export function parseApiErrors(body: unknown): FieldErrors | null {
  if (!isPlainRecord(body)) return null;

  const fields = body.fields;
  if (!isPlainRecord(fields)) return null;

  const errors: FieldErrors = {};

  const name = readErrorMessage(fields.name);
  if (name !== undefined) errors.name = name;

  const email = readErrorMessage(fields.email);
  if (email !== undefined) errors.email = email;

  const intent = readErrorMessage(fields.intent);
  if (intent !== undefined) errors.intent = intent;

  const message = readErrorMessage(fields.message);
  if (message !== undefined) errors.message = message;

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Extract the top-level error message from an API error response body.
 *
 * @param body - Parsed (untrusted) response body
 * @returns The message string, or `null` when the body carries none
 */
export function parseApiErrorMessage(body: unknown): string | null {
  if (!isPlainRecord(body)) return null;
  return readErrorMessage(body.error) ?? null;
}
