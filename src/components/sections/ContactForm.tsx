"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

const INTENT_OPTIONS = [
  "Full-time opportunity",
  "Freelance project",
  "Speaking or partnership",
  "Other",
];

type SubmitState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [state, setState] = useState<SubmitState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Request failed");
      setState("success");
      event.currentTarget.reset();
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <p className="rounded-md bg-brand-blue-tint p-6 text-brand-blue-dark">
        Thanks — your message is in. I usually reply within 48 hours.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-text-body">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium text-text-body">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="intent" className="text-sm font-medium text-text-body">
          What&apos;s this about?
        </label>
        <select
          id="intent"
          name="intent"
          required
          className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
        >
          {INTENT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-medium text-text-body">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      {state === "error" ? (
        <p className="text-sm text-red-600">
          Something went wrong sending that — try again, or email directly using the address below.
        </p>
      ) : null}

      <Button type="submit" variant="primary" className="self-start">
        {state === "submitting" ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
