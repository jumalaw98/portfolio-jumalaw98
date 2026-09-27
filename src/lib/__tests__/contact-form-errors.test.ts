import { describe, it, expect } from "vitest";
import { errorsToMap, parseApiErrors, parseApiErrorMessage } from "@/lib/contact-form-errors";
import type { ValidationError } from "@/lib/validation";

/**
 * Security regression tests for the contact-form error plumbing.
 *
 * `parseApiErrors()` consumes an untrusted HTTP response body, so these tests
 * assert the two properties that keep it out of the object-injection sink
 * category:
 *   1. keys are allowlisted — prototype-related names are ignored
 *   2. values must be non-empty strings, so nothing exotic is stored in state
 *      (and, after the refactor, no dynamic key is written at all)
 */

describe("parseApiErrors", () => {
  it("extracts allowlisted string messages", () => {
    expect(
      parseApiErrors({
        error: "Validation failed.",
        fields: { name: "Name is required.", message: "Message is too short." },
      }),
    ).toEqual({ name: "Name is required.", message: "Message is too short." });
  });

  it("ignores keys outside the allowlist (prototype pollution payloads)", () => {
    const result = parseApiErrors({
      fields: {
        __proto__: "polluted",
        constructor: "polluted",
        prototype: "polluted",
        name: "ok",
        toString: "polluted",
      },
    });

    expect(result).toEqual({ name: "ok" });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.keys(result ?? {})).toEqual(["name"]);
  });

  it("ignores non-string values", () => {
    expect(
      parseApiErrors({
        fields: { name: 42, email: { evil: true }, intent: ["a"], message: null },
      }),
    ).toBeNull();
  });

  it("ignores empty and whitespace-only messages", () => {
    expect(parseApiErrors({ fields: { name: "", email: "   " } })).toBeNull();
  });

  it("rejects malformed bodies without throwing", () => {
    for (const body of [null, undefined, "fields", 42, [], { fields: [] }, {}]) {
      expect(parseApiErrors(body)).toBeNull();
    }
  });

  it("returns a sparse object so the focus-on-error hook skips untouched fields", () => {
    const result = parseApiErrors({ fields: { email: "bad address" } });
    expect(result).toEqual({ email: "bad address" });
    expect(Object.keys(result ?? {})).toEqual(["email"]);
  });
});

describe("parseApiErrorMessage", () => {
  it("returns a non-empty string message", () => {
    expect(parseApiErrorMessage({ error: "Request rejected." })).toBe("Request rejected.");
  });

  it("returns null for missing, empty or non-string messages", () => {
    for (const body of [null, undefined, {}, { error: "" }, { error: "  " }, { error: 42 }, []]) {
      expect(parseApiErrorMessage(body)).toBeNull();
    }
  });
});

describe("errorsToMap", () => {
  it("maps validator errors onto named fields", () => {
    const errors: ValidationError[] = [
      { field: "name", message: "Name is required." },
      { field: "message", message: "Message is required." },
    ];

    expect(errorsToMap(errors)).toEqual({
      name: "Name is required.",
      message: "Message is required.",
    });
  });

  it("never writes a key that is not a known field", () => {
    // Simulates an unexpected runtime value (e.g. a field name from a future
    // refactor or an untyped caller): the explicit switch must not copy it
    // into the map as a dynamic key.
    const rogue = [
      { field: "__proto__", message: "polluted" },
      { field: "constructor", message: "polluted" },
    ] as unknown as ValidationError[];

    const map = errorsToMap(rogue);

    expect(map).toEqual({});
    expect(Object.getPrototypeOf(map)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
