import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("env — centralized environment validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, NODE_ENV: "test" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns defaults for optional vars", async () => {
    const { env } = await import("@/lib/env");
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://jumalaw98.vercel.app");
    expect(env.CONTACT_RECEIVER_EMAIL).toBe("jumalaw98@gmail.com");
    expect(env.MONITOR_WEBHOOK_URL).toBeNull();
    expect(env.MONITOR_EMAIL_TO).toBeNull();
    expect(env.MONITOR_EMAIL_FROM).toBe("Portfolio Monitor <onboarding@resend.dev>");
  });

  it("uses NEXT_PUBLIC_SITE_URL when set", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://custom.example.com";
    const { env } = await import("@/lib/env");
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://custom.example.com");
  });

  it("passes through MONITOR_WEBHOOK_URL when set", async () => {
    process.env.MONITOR_WEBHOOK_URL = "https://hooks.slack.com/test";
    const { env } = await import("@/lib/env");
    expect(env.MONITOR_WEBHOOK_URL).toBe("https://hooks.slack.com/test");
  });

  it("returns null for unset optional vars", async () => {
    delete process.env.BUFFER_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    const { env } = await import("@/lib/env");
    expect(env.BUFFER_API_KEY).toBeNull();
    expect(env.GEMINI_API_KEY).toBeNull();
    expect(env.OPENROUTER_API_KEY).toBeNull();
  });

  it("does not crash in test environment without RESEND_API_KEY", async () => {
    delete process.env.RESEND_API_KEY;
    const { env } = await import("@/lib/env");
    expect(env.RESEND_API_KEY).toBeNull();
  });
});
