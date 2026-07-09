import { NextResponse } from "next/server";
import { CONTACT_EMAIL } from "@/lib/constants";

// Route Handler for the contact form. Wired for Resend — swap in your API key
// via RESEND_API_KEY in .env.local, or replace this whole handler with a
// direct Formspree endpoint call from ContactForm.tsx if you'd rather skip
// backend code entirely (see project-architecture.md "Form handling advice").
export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, intent, message } = body as {
    name?: string;
    email?: string;
    intent?: string;
    message?: string;
  };

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL ?? CONTACT_EMAIL;

  if (!resendApiKey) {
    // No API key configured yet — log for local dev instead of failing silently.
    console.warn(
      "RESEND_API_KEY not set — contact form submission was received but not emailed.",
      { name, email, intent },
    );
    return NextResponse.json({ ok: true, delivered: false });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Portfolio Contact Form <onboarding@resend.dev>", // TODO: swap to a verified sending domain
      to: receiverEmail,
      reply_to: email,
      subject: `New portfolio contact: ${intent ?? "General"} — ${name}`,
      text: `From: ${name} <${email}>\nIntent: ${intent ?? "n/a"}\n\n${message}`,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, delivered: true });
}
