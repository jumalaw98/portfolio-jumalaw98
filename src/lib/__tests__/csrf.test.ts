import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateOrigin } from "@/lib/csrf";

function makeRequest(headers: Record<string, string>): Request {
  return new Request("https://jumalaw98.vercel.app/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ name: "Test" }),
  });
}

describe("validateOrigin — CSRF protection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://jumalaw98.vercel.app");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows same-origin request via Origin header", () => {
    const req = makeRequest({ origin: "https://jumalaw98.vercel.app" });
    const result = validateOrigin(req);
    expect(result.ok).toBe(true);
  });

  it("allows request with custom NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://my-custom-site.com");
    const req = makeRequest({ origin: "https://my-custom-site.com" });
    const result = validateOrigin(req);
    expect(result.ok).toBe(true);
  });

  it("rejects cross-origin request", () => {
    const req = makeRequest({ origin: "https://evil.com" });
    const result = validateOrigin(req);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("not in allowlist");
  });

  it("allows same-origin via Referer header", () => {
    const req = makeRequest({
      referer: "https://jumalaw98.vercel.app/contact",
    });
    const result = validateOrigin(req);
    expect(result.ok).toBe(true);
  });

  it("rejects cross-origin via Referer header", () => {
    const req = makeRequest({
      referer: "https://evil.com/malicious",
    });
    const result = validateOrigin(req);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("not in allowlist");
  });

  it("rejects request with invalid Referer URL", () => {
    const req = makeRequest({
      referer: "not-a-valid-url",
    });
    const result = validateOrigin(req);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Invalid Referer");
  });

  it("rejects request missing both Origin and Referer", () => {
    const req = makeRequest({});
    const result = validateOrigin(req);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Missing both");
  });

  it("handles trailing slash in Origin", () => {
    const req = makeRequest({ origin: "https://jumalaw98.vercel.app/" });
    const result = validateOrigin(req);
    expect(result.ok).toBe(true);
  });

  it("handles trailing slash in Referer", () => {
    const req = makeRequest({
      referer: "https://jumalaw98.vercel.app/contact/",
    });
    const result = validateOrigin(req);
    expect(result.ok).toBe(true);
  });

  it("always allows the default Vercel URL even when env is not set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const req = makeRequest({ origin: "https://jumalaw98.vercel.app" });
    const result = validateOrigin(req);
    expect(result.ok).toBe(true);
  });

  it("prefers Origin over Referer", () => {
    const req = makeRequest({
      origin: "https://evil.com",
      referer: "https://jumalaw98.vercel.app/contact",
    });
    // Origin is checked first, so this should be rejected
    const result = validateOrigin(req);
    expect(result.ok).toBe(false);
  });
});
