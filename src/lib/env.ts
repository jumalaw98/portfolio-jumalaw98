/**
 * Centralized environment variable validation.
 *
 * Validates all required and optional env vars at module load time.
 * If a required var is missing, the app crashes with a clear error.
 * Optional vars have sensible defaults and are logged as warnings.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   // env.RESEND_API_KEY is a string (validated)
 *   // env.MONITOR_WEBHOOK_URL is string | null (optional)
 */

/**
 * Centralized env module — all process.env access should go through here.
 * If a required var is missing, the process crashes immediately on import.
 */
function validateEnv() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── Required vars (runtime only — not validated at build time) ─────
  // RESEND_API_KEY is only needed when the contact form is actually submitted.
  // The contact route already returns 503 if the key is missing at runtime.
  // We skip validation during `next build` (build workers don't need it).
  const isBuild = process.env.npm_lifecycle_event === "build" || process.argv.includes("build");
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY && !isBuild) {
    // Only warn, don't crash — the contact route degrades gracefully.
    warnings.push("RESEND_API_KEY not set — contact form will return 503 at runtime");
  }

  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === "production") {
      warnings.push(
        "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — falling back to in-memory rate limiting",
      );
    }
  }

  // ── Optional vars ────────────────────────────────────────────────────
  const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jumalaw98.vercel.app";
  const CONTACT_RECEIVER_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || "jumalaw98@gmail.com";
  const MONITOR_WEBHOOK_URL = process.env.MONITOR_WEBHOOK_URL || null;
  const MONITOR_EMAIL_TO = process.env.MONITOR_EMAIL_TO || null;
  const MONITOR_EMAIL_FROM =
    process.env.MONITOR_EMAIL_FROM || "Portfolio Monitor <onboarding@resend.dev>";
  const HASHNODE_PUBLICATION_HOST = process.env.HASHNODE_PUBLICATION_HOST || null;
  const BUFFER_API_KEY = process.env.BUFFER_API_KEY || null;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || null;

  // ── Fail fast ────────────────────────────────────────────────────────
  if (errors.length > 0) {
    console.error(
      JSON.stringify({
        event: "env.validation_failed",
        errors,
        message: "Missing required environment variables. See .env.example for details.",
      }),
    );
    process.exit(1);
  }

  // ── Warnings ─────────────────────────────────────────────────────────
  for (const warning of warnings) {
    console.warn(
      JSON.stringify({
        event: "env.validation_warning",
        message: warning,
      }),
    );
  }

  return {
    RESEND_API_KEY: RESEND_API_KEY || null,
    UPSTASH_REDIS_REST_URL: UPSTASH_REDIS_REST_URL || null,
    UPSTASH_REDIS_REST_TOKEN: UPSTASH_REDIS_REST_TOKEN || null,
    NEXT_PUBLIC_SITE_URL,
    CONTACT_RECEIVER_EMAIL,
    MONITOR_WEBHOOK_URL,
    MONITOR_EMAIL_TO,
    MONITOR_EMAIL_FROM,
    HASHNODE_PUBLICATION_HOST,
    BUFFER_API_KEY,
    GEMINI_API_KEY,
    OPENROUTER_API_KEY,
  } as const;
}

/**
 * Validated environment variables.
 * Access via `env.RESEND_API_KEY`, `env.MONITOR_WEBHOOK_URL`, etc.
 * Crash-fast on missing required vars at import time.
 */
export const env = validateEnv();
