import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
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
    vi.unstubAllEnvs();
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

  it("uses the default deployment only when no site URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const req = makeRequest({ origin: "https://jumalaw98.vercel.app" });
    const result = validateOrigin(req);
    expect(result.ok).toBe(true);
  });

  it("canonicalizes configured URLs and Origin headers", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://EXAMPLE.com:443/portfolio");
    const req = makeRequest({ origin: "https://example.com" });
    expect(validateOrigin(req).ok).toBe(true);
  });

  it("does not trust the default deployment when a custom URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://my-custom-site.com");
    const req = makeRequest({ origin: "https://jumalaw98.vercel.app" });
    expect(validateOrigin(req).ok).toBe(false);
  });

  it("allows localhost during development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const req = makeRequest({ origin: "http://localhost:3000" });
    expect(validateOrigin(req).ok).toBe(true);
  });

  it("ignores malformed development origins instead of throwing", () => {
    vi.stubEnv("NODE_ENV", "development");
    const req = makeRequest({ origin: "not a valid origin" });
    expect(validateOrigin(req).ok).toBe(false);
    expect(validateOrigin(req).reason).toContain("not in allowlist");
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
