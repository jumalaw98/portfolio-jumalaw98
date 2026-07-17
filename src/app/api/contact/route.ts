import { NextResponse } from "next/server";
import { CONTACT_EMAIL } from "@/lib/constants";
import { validateContactForm } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract the client IP from the request object. */
function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Convert validation errors to a fields record for the API response. */
function errorsToFields(errors: { field: string; message: string }[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const e of errors) {
    fields[e.field] = e.message;
  }
  return fields;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // ── Rate limiting ─────────────────────────────────────────────────--
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": "0",
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
    // If a bot filled the hidden field, silently return success to avoid
    // tipping it off, but do NOT send the email.
    if (raw._hp_) {
      // Log for monitoring
      console.warn("Contact form honeypot triggered", { ip });
      return NextResponse.json({ ok: true, delivered: false });
    }

    // ── Server-side validation ──────────────────────────────────────────
    // Never trust the client — validate everything again on the server.
    const validation = validateContactForm(raw);

    if (!validation.valid) {
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
    const correlationId = crypto.randomUUID().slice(0, 8);

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not set — contact form submission not emailed.", {
        correlationId,
      });

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
        console.warn("Resend API request timed out", { correlationId });
        return NextResponse.json(
          { error: "Message delivery timed out. Please try again or email directly." },
          { status: 504 },
        );
      }
      throw err;
    }
    clearTimeout(timeoutId);

    if (!resendResponse.ok) {
      console.error("Resend API error", {
        status: resendResponse.status,
        correlationId,
      });
      return NextResponse.json(
        { error: "Failed to send message. Please try again or email directly." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("Unexpected error in contact API route:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or email directly." },
      { status: 500 },
    );
  }
}
