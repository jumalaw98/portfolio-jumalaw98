import { NextResponse, after } from "next/server";
import { CONTACT_EMAIL } from "@/lib/constants";
import { validateContactForm } from "@/lib/validation";
import { contactLimiter, getClientIp } from "@/lib/rate-limit";
import { track } from "@/lib/instrument";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert validation errors to a fields record for the API response. */
function errorsToFields(errors: { field: string; message: string }[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const e of errors) {
    fields[e.field] = e.message;
  }
  return fields;
}

interface SendEmailParams {
  name: string;
  email: string;
  intent?: string;
  message: string;
  receiverEmail: string;
  resendApiKey: string;
  submissionId: string;
}

/**
 * Send the contact email via the Resend API.
 * Returns a NextResponse on success or a known failure (non-2xx, timeout).
 * Unexpected fetch errors (network, DNS, etc.) are re-thrown to the caller.
 */
async function sendViaResend(params: SendEmailParams): Promise<NextResponse> {
  const { name, email, intent, message, receiverEmail, resendApiKey, submissionId } = params;

  const controller = new AbortController();
  const TIMEOUT_MS = 10_000;
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let resendResponse: Response;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": submissionId,
      },
      body: JSON.stringify({
        from: "Portfolio Contact Form <onboarding@resend.dev>", // TODO: swap to a verified sending domain
        to: receiverEmail,
        reply_to: email,
        subject: `New portfolio contact: ${intent || "General"} — ${name}`,
        text: `From: ${name} <${email}>\nIntent: ${intent || "n/a"}\n\n${message}`,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      track.deliveryTimeout();
      return NextResponse.json(
        { error: "Message delivery timed out. Please try again or email directly." },
        { status: 504 },
      );
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!resendResponse.ok) {
    track.deliveryFailed(resendResponse.status);
    return NextResponse.json(
      { error: "Failed to send message. Please try again or email directly." },
      { status: 502 },
    );
  }

  track.deliverySuccess();
  return NextResponse.json({ ok: true, delivered: true });
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // ── Rate limiting ─────────────────────────────────────────────────--
    const ip = getClientIp(request);

    // Reject requests with no resolvable IP rather than bypassing the limiter.
    // Falling through on null would let any headerless request — e.g. behind a
    // misconfigured proxy — submit unlimited emails, defeating abuse protection.
    if (ip === null) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(60 * 60) },
        },
      );
    }

    const { success, limit, remaining, reset, pending } = await contactLimiter.limit(ip);

    // Register the analytics promise with the Next.js invocation lifecycle
    // so it is not dropped when the response is returned.
    after(pending);

    if (!success) {
      track.rateLimitHit(ip, limit, remaining);

      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(Math.floor(reset / 1000)),
          },
        },
      );
    }

    // ── Parse body ──────────────────────────────────────────────────────
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const raw = body as Record<string, unknown>;

    // ── Honeypot check ──────────────────────────────────────────────────
    if (raw._hp_) {
      track.honeypotTriggered(ip ?? "unknown");
      return NextResponse.json({ ok: true, delivered: false });
    }

    // ── Server-side validation ──────────────────────────────────────────
    const validation = validateContactForm(raw);

    if (!validation.valid) {
      track.validationFailed(validation.errors.map((e) => e.field));
      return NextResponse.json(
        {
          error: "Validation failed.",
          fields: errorsToFields(validation.errors),
        },
        { status: 422 },
      );
    }

    // ── Validate email recipient ────────────────────────────────────────
    const { name, email, intent, message } = validation.data;
    const resendApiKey = process.env.RESEND_API_KEY;
    const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL ?? CONTACT_EMAIL;

    if (!resendApiKey) {
      const isDev = process.env.NODE_ENV === "development";
      if (isDev) {
        return NextResponse.json({ ok: true, delivered: false });
      }
      return NextResponse.json(
        {
          error: "Message delivery is not configured. Please try again later or email directly.",
        },
        { status: 503 },
      );
    }

    // ── Send via Resend ─────────────────────────────────────────────────
    /** Stable submission ID for idempotent retries. */
    const submissionId =
      typeof raw.submissionId === "string" && raw.submissionId.length > 0
        ? raw.submissionId
        : crypto.randomUUID();

    return await sendViaResend({
      name,
      email,
      intent,
      message,
      receiverEmail,
      resendApiKey,
      submissionId,
    });
  } catch (err) {
    track.unexpectedError(err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or email directly." },
      { status: 500 },
    );
  }
}
