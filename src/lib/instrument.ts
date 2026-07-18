/**
 * Lightweight server-side instrumentation for the contact form.
 *
 * Three output channels — first is always enabled, the others are opt-in:
 *   1. Structured JSON logs → Vercel Logs dashboard (built-in, free)
 *   2. Optional webhook       → Discord / Slack (MONITOR_WEBHOOK_URL)
 *   3. Optional email alerts  → your inbox via Resend (MONITOR_EMAIL_TO)
 *
 * Every event has a dotted name (e.g. "contact.rate_limit_hit"),
 * an ISO-8601 timestamp, a correlation ID, and typed metadata.
 *
 * Email alerts include a subject line prefixed with [Portfolio] so you
 * can filter / route them in your inbox. A per-event-type Redis-backed throttle
 * prevents flooding (max ~1 email / 5 min per type) across all instances.
 */

import { after } from "next/server";
import { Redis } from "@upstash/redis";

// ─── Types ───────────────────────────────────────────────────────────────────

type EventLevel = "info" | "warn" | "error";

/**
 * Known contact-form event names. Kept internal — callers use the `track`
 * object, which enforces the correct payload for each event type.
 */
type ContactEventName =
  | "contact.rate_limit_hit"
  | "contact.honeypot_triggered"
  | "contact.delivery_failed"
  | "contact.delivery_timeout"
  | "contact.delivery_succeeded"
  | "contact.validation_failed"
  | "contact.unexpected_error";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Min interval between email alerts of the same event type. */
const EMAIL_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

// ─── Env bindings (module-scoped, read once at first import) ─────────────────

const WEBHOOK_URL = process.env.MONITOR_WEBHOOK_URL ?? null;
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? null;
const MONITOR_EMAIL_TO = process.env.MONITOR_EMAIL_TO ?? null;
const MONITOR_EMAIL_FROM =
  process.env.MONITOR_EMAIL_FROM || "Portfolio Monitor <onboarding@resend.dev>";

// ─── Redis-backed email throttle (shared across all instances) ──────────────

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const isRedisConfigured = Boolean(REDIS_URL && REDIS_TOKEN);

/**
 * Redis client for email throttling. Null when Upstash env vars are not set,
 * in which case throttle checks are skipped (no cross-instance deduplication).
 */
const redisForThrottle: Redis | null = isRedisConfigured
  ? new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! })
  : null;

/** TTL in seconds for the email throttle key. */
const EMAIL_THROTTLE_TTL_S = Math.ceil(EMAIL_THROTTLE_MS / 1000);

/**
 * Atomically reserve the throttle key for an event type.
 * Returns true if the reservation was acquired (not throttled).
 * Returns true (skip throttle) when Redis is not configured.
 */
async function tryAcquireThrottle(eventType: string): Promise<boolean> {
  if (!redisForThrottle) return true;

  const key = `email_throttle:${eventType}`;
  const result = await redisForThrottle.set(key, "1", {
    ex: EMAIL_THROTTLE_TTL_S,
    nx: true,
  });
  return result === "OK";
}

async function releaseThrottle(eventType: string): Promise<void> {
  if (!redisForThrottle) return;
  await redisForThrottle.del(`email_throttle:${eventType}`);
}

// ─── Subject builders ────────────────────────────────────────────────────────

type SubjectBuilder = (meta: Record<string, unknown>) => string;

const EMAIL_SUBJECTS: Record<ContactEventName, SubjectBuilder> = {
  "contact.rate_limit_hit": (m) => `[Portfolio] 🚨 Abuse detected — ${stringifyUnknown(m.ip)}`,
  "contact.honeypot_triggered": (m) => `[Portfolio] 🤖 Bot activity — ${stringifyUnknown(m.ip)}`,
  "contact.delivery_failed": (m) =>
    `[Portfolio] ⚠️ Resend failure (HTTP ${stringifyUnknown(m.status)})`,
  "contact.delivery_timeout": () => "[Portfolio] ⏱️ Resend timeout",
  "contact.delivery_succeeded": () => "[Portfolio] ✅ Message delivered",
  "contact.validation_failed": (m) => {
    const fields = Array.isArray(m.fields) ? (m.fields as string[]).join(", ") : "unknown";
    return `[Portfolio] ⚠️ Validation failed — ${fields}`;
  },
  "contact.unexpected_error": () => "[Portfolio] 💥 Unexpected error",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function isoNow(): string {
  return new Date().toISOString();
}

/** Safely convert an unknown value to a readable string (avoids "[object Object]"). */
function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return `(unserializable ${Object.prototype.toString.call(value).slice(8, -1)})`;
    }
  }
  return String(value);
}

// ─── Channel: Webhook (Discord / Slack, opt-in) ──────────────────────────────

interface WebhookPayload {
  content: string;
  username?: string;
}

/**
 * Fire-and-forget webhook POST. Never throws — errors are silently caught
 * so a webhook failure never affects the API response.
 */
async function sendWebhook(event: {
  event: string;
  level: EventLevel;
  correlationId: string;
  [key: string]: unknown;
}): Promise<void> {
  if (!WEBHOOK_URL) return;

  const payload: WebhookPayload = {
    username: "Contact Monitor",
    content: [
      `**${event.event}** [\`${event.correlationId}\`]`,
      ...Object.entries(event)
        .filter(([k]) => !["event", "correlationId", "timestamp", "level"].includes(k))
        .map(([k, v]) => `  ${k}: \`${JSON.stringify(v)}\``),
    ].join("\n"),
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) {
      console.warn(
        JSON.stringify({
          event: "monitor.webhook_error",
          status: res.status,
          correlationId: event.correlationId,
        }),
      );
    }
  } catch {
    /* Silently ignore webhook failures — must never break the API. */
  }
}

// ─── Channel: Email alert (Resend, opt-in) ───────────────────────────────────

function formatEmailBody(event: {
  event: string;
  timestamp: string;
  level: EventLevel;
  correlationId: string;
  [key: string]: unknown;
}): string {
  const metaLines = Object.entries(event)
    .filter(([k]) => !["event", "timestamp", "level", "correlationId"].includes(k))
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`);

  return [
    `Event: ${event.event}`,
    `Time:  ${event.timestamp}`,
    `Level: ${event.level}`,
    `ID:    ${event.correlationId}`,
    "",
    "Details:",
    ...(metaLines.length > 0 ? metaLines : ["  (none)"]),
    "",
    "---",
    "Sent by Portfolio Contact Monitor",
  ].join("\n");
}

/**
 * Fire-and-forget email alert via Resend. Never throws.
 * Throttled per event type to avoid inbox flooding.
 */
async function sendAlertEmail(event: {
  event: string;
  timestamp: string;
  level: EventLevel;
  correlationId: string;
  [key: string]: unknown;
}): Promise<void> {
  if (!RESEND_API_KEY || !MONITOR_EMAIL_TO) return;

  // Atomically reserve the throttle key — skip if another instance sent recently
  try {
    if (!(await tryAcquireThrottle(event.event))) return;
  } catch {
    return; // Redis unavailable — skip alert silently
  }

  // Build subject
  const buildSubject = EMAIL_SUBJECTS[event.event as ContactEventName];
  const subject = buildSubject ? buildSubject(event) : `[Portfolio] ${event.event}`;

  const bodyText = formatEmailBody(event);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MONITOR_EMAIL_FROM, // Default is Resend's test sender — set MONITOR_EMAIL_FROM to a verified sending domain in production
        to: [MONITOR_EMAIL_TO],
        subject,
        text: bodyText,
      }),
      signal: AbortSignal.timeout(5_000),
    });

    // Non-2xx responses are failures — release throttle to allow retries
    if (!res.ok) {
      await releaseThrottle(event.event);
    }
  } catch {
    // Delivery error — release throttle to allow retries
    await releaseThrottle(event.event);
    /* Silently ignore email failures — must never break the API. */
  }
}

// ─── Emit ────────────────────────────────────────────────────────────────────

function emit(level: EventLevel, event: string, meta: Record<string, unknown>): void {
  const correlationId = (meta.correlationId as string) ?? generateId();
  const timestamp = isoNow();

  const entry = { event, timestamp, level, correlationId, ...meta };

  // Channel 1: structured JSON log → Vercel Logs
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }

  // Channel 2: webhook (fire-and-forget, runs after response is sent)
  // Channel 3: email alert (fire-and-forget, throttled, runs after response is sent)
  // Using after() ensures both complete before the platform terminates the invocation.
  after(async () => {
    await sendWebhook(entry);
    await sendAlertEmail(entry);
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const track = {
  rateLimitHit(ip: string, limit: number, remaining: number): string {
    const correlationId = generateId();
    emit("warn", "contact.rate_limit_hit", { correlationId, ip, limit, remaining });
    return correlationId;
  },

  honeypotTriggered(ip: string): string {
    const correlationId = generateId();
    emit("warn", "contact.honeypot_triggered", { correlationId, ip });
    return correlationId;
  },

  deliveryFailed(status: number, error?: string): string {
    const correlationId = generateId();
    emit("error", "contact.delivery_failed", { correlationId, status, error });
    return correlationId;
  },

  deliveryTimeout(): string {
    const correlationId = generateId();
    emit("warn", "contact.delivery_timeout", { correlationId });
    return correlationId;
  },

  deliverySuccess(correlationId?: string): string {
    const id = correlationId ?? generateId();
    emit("info", "contact.delivery_succeeded", { correlationId: id });
    return id;
  },

  validationFailed(fields: string[]): string {
    const correlationId = generateId();
    emit("info", "contact.validation_failed", { correlationId, fields });
    return correlationId;
  },

  unexpectedError(error: unknown): string {
    const correlationId = generateId();
    const message = error instanceof Error ? error.message : stringifyUnknown(error);
    emit("error", "contact.unexpected_error", { correlationId, message });
    return correlationId;
  },
};
