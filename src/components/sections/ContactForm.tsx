"use client";

import { useState, useId, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { validateContactForm, INTENT_OPTIONS } from "@/lib/validation";
import { errorsToMap, parseApiErrors, parseApiErrorMessage } from "@/lib/contact-form-errors";
import type { FieldErrors, FieldName } from "@/lib/contact-form-errors";

type SubmitState = "idle" | "submitting" | "success" | "error";

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again or email directly.";

// ─── Submit helpers ───────────────────────────────────────────────────────────

type SubmitResult =
  | { status: "success" }
  | { status: "field-error"; fields: FieldErrors }
  | { status: "error"; message: string };

async function submitToApi(
  body: Record<string, unknown>,
  form: HTMLFormElement,
): Promise<SubmitResult> {
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const parsed: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const serverFields = parseApiErrors(parsed);
      if (serverFields) {
        return { status: "field-error", fields: serverFields };
      }
      return { status: "error", message: parseApiErrorMessage(parsed) ?? GENERIC_ERROR_MESSAGE };
    }

    form.reset();
    return { status: "success" };
  } catch {
    return {
      status: "error",
      message: GENERIC_ERROR_MESSAGE,
    };
  }
}

// ─── Focus-on-error hook ──────────────────────────────────────────────────────

function useFocusFirstError(
  fieldErrors: FieldErrors,
  formRef: React.RefObject<HTMLFormElement | null>,
) {
  useEffect(() => {
    const firstKey = (Object.keys(fieldErrors) as (keyof FieldErrors)[])[0];
    if (!firstKey || !formRef.current) return;
    const el = formRef.current.elements.namedItem(firstKey);
    if (el instanceof HTMLElement) el.focus();
  }, [fieldErrors, formRef]);
}

// ─── Field sub-component ──────────────────────────────────────────────────────

interface ContactFieldProps {
  readonly id: string;
  readonly errorId: string;
  readonly name: string;
  readonly label: string;
  readonly type: "text" | "email" | "select" | "textarea";
  readonly error?: string;
  readonly describedby?: string;
  readonly options?: readonly string[];
  readonly rows?: number;
}

function ContactField({
  id,
  errorId,
  name,
  label,
  type,
  error,
  describedby,
  options,
  rows,
}: ContactFieldProps) {
  const hasError = Boolean(error);
  const inputClass = `mt-1 w-full rounded-md border px-3 py-2 text-sm ${
    hasError ? "border-red-500" : "border-border"
  }`;

  const sharedProps = {
    id,
    name,
    required: true as const,
    "aria-required": "true" as const,
    "aria-invalid": hasError ? ("true" as const) : undefined,
    "aria-describedby": describedby,
    className: inputClass,
  };

  const renderInput = () => {
    if (type === "textarea") {
      return <textarea {...sharedProps} rows={rows} />;
    }
    if (type === "select") {
      return (
        <select {...sharedProps}>
          <option value="">Select…</option>
          {options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    return <input {...sharedProps} type={type} />;
  };

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-text-body">
        {label}
      </label>
      {renderInput()}
      {hasError ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ContactForm() {
  const formId = useId();
  const prefix = `contact-${formId}`;
  const fieldIds = {
    name: `${prefix}-name`,
    email: `${prefix}-email`,
    intent: `${prefix}-intent`,
    message: `${prefix}-message`,
  };
  const errorIds = {
    name: `${prefix}-name-error`,
    email: `${prefix}-email-error`,
    intent: `${prefix}-intent-error`,
    message: `${prefix}-message-error`,
  };
  const formErrorId = `${prefix}-form-error`;
  const statusId = `${prefix}-status`;

  const [state, setState] = useState<SubmitState>("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const submissionIdRef = useRef<string>(crypto.randomUUID());
  const formRef = useRef<HTMLFormElement>(null);

  useFocusFirstError(fieldErrors, formRef);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || state === "submitting") return;
    submittingRef.current = true;

    setFormError(null);
    setFieldErrors({});

    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form)) as Record<string, unknown>;
    const validation = validateContactForm(raw);
    if (!validation.valid) {
      setFieldErrors(errorsToMap(validation.errors));
      submittingRef.current = false;
      return;
    }

    setState("submitting");

    const result = await submitToApi(
      { ...validation.data, _hp_: raw._hp_, submissionId: submissionIdRef.current },
      form,
    );

    if (result.status === "field-error") {
      setFieldErrors(result.fields);
      setState("idle");
      submittingRef.current = false;
      return;
    }

    if (result.status === "error") {
      setFormError(result.message);
      setState("error");
      submittingRef.current = false;
      return;
    }

    setState("success");
    submittingRef.current = false;
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <output
        id={statusId}
        className="block rounded-md bg-brand-blue-tint p-6 text-brand-blue-dark"
      >
        Thanks — your message is in. I usually reply within 48 hours.
      </output>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────
  const isSubmitting = state === "submitting";

  // Resolved statically (one named property per field) so nothing indexes an
  // object with a variable key.
  const describedBy: Record<FieldName, string | undefined> = {
    name: fieldErrors.name ? errorIds.name : undefined,
    email: fieldErrors.email ? errorIds.email : undefined,
    intent: fieldErrors.intent ? errorIds.intent : undefined,
    message: fieldErrors.message ? errorIds.message : undefined,
  };

  return (
    <>
      {/* Screen-reader announcement for submission state changes */}
      <output id={statusId} aria-live="polite" className="sr-only">
        {isSubmitting ? "Sending your message…" : null}
      </output>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5"
        aria-label="Contact form"
      >
        {/* ── Honeypot ────────────────────────────────────────────────── */}
        {/* Invisible to humans; bots that auto-fill all fields will reveal themselves. */}
        <div
          aria-hidden="true"
          className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
        >
          <label htmlFor={`${prefix}-hp`}>Leave this empty</label>
          <input id={`${prefix}-hp`} name="_hp_" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <ContactField
          id={fieldIds.name}
          errorId={errorIds.name}
          name="name"
          label="Name"
          type="text"
          error={fieldErrors.name}
          describedby={describedBy.name}
        />

        <ContactField
          id={fieldIds.email}
          errorId={errorIds.email}
          name="email"
          label="Email"
          type="email"
          error={fieldErrors.email}
          describedby={describedBy.email}
        />

        <ContactField
          id={fieldIds.intent}
          errorId={errorIds.intent}
          name="intent"
          label="What's this about?"
          type="select"
          error={fieldErrors.intent}
          describedby={describedBy.intent}
          options={INTENT_OPTIONS}
        />

        <ContactField
          id={fieldIds.message}
          errorId={errorIds.message}
          name="message"
          label="Message"
          type="textarea"
          error={fieldErrors.message}
          describedby={describedBy.message}
          rows={5}
        />

        {/* ── General error ───────────────────────────────────────────── */}
        {formError ? (
          <p id={formErrorId} role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        ) : null}

        {/* ── Submit ───────────────────────────────────────────────────── */}
        <Button type="submit" variant="primary" className="self-start" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send Message"}
        </Button>
      </form>
    </>
  );
}
