/**
 * Centralized environment variable validation.
 *
 * Reads all runtime configuration at module load time.
 * Features with absent credentials degrade gracefully and log a clear warning.
 * Optional vars have sensible defaults and are logged as warnings.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   // env.RESEND_API_KEY may be null when unset; callers must handle nullable values
 *   // env.MONITOR_WEBHOOK_URL is string | null (optional)
 */

/**
 * Centralized server-side env module — runtime code should use this instead of
 * reading process.env directly.
 */

import { isEmailAddress, normalizeMailbox, parseMailbox } from "@/lib/mailbox";

/**
 * Known-good defaults for the two sender identities.
 *
 * Both are Resend's shared test sender; production deployments are expected to
 * override them with a verified sending domain.
 */
const DEFAULT_CONTACT_SENDER = "Portfolio Contact Form <onboarding@resend.dev>";
const DEFAULT_MONITOR_SENDER = "Portfolio Monitor <onboarding@resend.dev>";
const DEFAULT_CONTACT_RECEIVER = "jumalawrence98@gmail.com";

function validateEnv() {
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

  // ── Mail header configuration ────────────────────────────────────────
  // Every value below is copied into an outbound SMTP header (`from`, `to`,
  // `reply_to`). Configuration is therefore parsed and re-serialised rather than
  // trusted verbatim: a stray CR/LF in an environment variable would otherwise
  // inject additional headers into the message. Invalid configuration degrades
  // to the known-good default with a warning (see src/lib/mailbox.ts).
  const rawContactReceiver = process.env.CONTACT_RECEIVER_EMAIL;
  const CONTACT_RECEIVER_EMAIL =
    rawContactReceiver && isEmailAddress(rawContactReceiver.trim())
      ? rawContactReceiver.trim()
      : DEFAULT_CONTACT_RECEIVER;
  if (rawContactReceiver && CONTACT_RECEIVER_EMAIL !== rawContactReceiver.trim()) {
    warnings.push(
      "CONTACT_RECEIVER_EMAIL is not a valid, header-safe email address — using the default receiver",
    );
  }

  const rawContactSender = process.env.CONTACT_SENDER_FROM;
  const CONTACT_SENDER_FROM = normalizeMailbox(rawContactSender, DEFAULT_CONTACT_SENDER);
  if (rawContactSender && !parseMailbox(rawContactSender)) {
    warnings.push("CONTACT_SENDER_FROM is not a valid, header-safe mailbox — using the default sender");
  }

  const MONITOR_WEBHOOK_URL = process.env.MONITOR_WEBHOOK_URL || null;

  const rawMonitorEmailTo = process.env.MONITOR_EMAIL_TO;
  const MONITOR_EMAIL_TO = rawMonitorEmailTo && isEmailAddress(rawMonitorEmailTo.trim())
    ? rawMonitorEmailTo.trim()
    : null;
  if (rawMonitorEmailTo && MONITOR_EMAIL_TO === null) {
    warnings.push("MONITOR_EMAIL_TO is not a valid, header-safe email address — alerts disabled");
  }

  const rawMonitorSender = process.env.MONITOR_EMAIL_FROM;
  const MONITOR_EMAIL_FROM = normalizeMailbox(rawMonitorSender, DEFAULT_MONITOR_SENDER);
  if (rawMonitorSender && !parseMailbox(rawMonitorSender)) {
    warnings.push("MONITOR_EMAIL_FROM is not a valid, header-safe mailbox — using the default sender");
  }

  const HASHNODE_PUBLICATION_HOST = process.env.HASHNODE_PUBLICATION_HOST || null;
  const BUFFER_API_KEY = process.env.BUFFER_API_KEY || null;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || null;

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
    CONTACT_SENDER_FROM,
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
 * Optional integrations are represented as null when not configured.
 */
export const env = validateEnv();
