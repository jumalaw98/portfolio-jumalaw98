/**
 * Shared validation logic for the contact form.
 * Pure functions — usable on both client and server.
 * No Node.js or browser-specific APIs, so it can be imported by either.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const MESSAGE_MIN = 20;
export const MESSAGE_MAX = 2000;

/** Threshold above which a value is considered "excessive repeated characters". */
const REPEATED_CHAR_THRESHOLD = 0.7;

/** RFC 5322 structural email validation (not RFC-compliant in the strictest sense). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valid intent options for the contact form. Shared between client and server. */
export const INTENT_OPTIONS = [
  "Full-time opportunity",
  "Freelance project",
  "Speaking or partnership",
  "Other",
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ValidationError {
  field: "name" | "email" | "intent" | "message";
  message: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  intent: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data: ContactFormData;
}

// ─── Spam-pattern detection ──────────────────────────────────────────────────

/** Individual QWERTY keyboard rows (number, top, home/middle, bottom). */
const NUMBER_ROW = new Set("1234567890");
const TOP_ROW = new Set("qwertyuiop");
const MIDDLE_ROW = new Set("asdfghjkl");
const BOTTOM_ROW = new Set("zxcvbnm");
const KEYBOARD_ROWS = [TOP_ROW, MIDDLE_ROW, BOTTOM_ROW, NUMBER_ROW];

/**
 * Check if any single character makes up ≥ 70% of the full (whitespace-inclusive)
 * string. Whitespace is included in the denominator so ordinary prose like
 * "We write to you about a project" is not falsely flagged as spam.
 */
function hasExcessiveRepeatedChars(value: string): boolean {
  if (value.length < 3) return false;

  const counts = new Map<string, number>();
  for (const char of value) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  const maxCount = Math.max(...counts.values());

  return maxCount / value.length >= REPEATED_CHAR_THRESHOLD;
}

function isKeyboardSpam(value: string): boolean {
  const lower = value.toLowerCase();
  // Keep whitespace in the denominator so ordinary prose is not falsely flagged.
  // Remove only non-whitespace, non-letter characters for row membership checks.
  const letters = [...lower].filter((c) => /[a-z0-9]/.test(c));
  if (letters.length < 4) return false;

  // Check if the majority of letter characters belong to a single keyboard row
  // (catches keyboard mashing like "asdfghjkl" or "qwertyqwerty")
  for (const row of KEYBOARD_ROWS) {
    const rowChars = letters.filter((c) => row.has(c)).length;
    if (rowChars / letters.length >= 0.8) return true;
  }

  return false;
}

// ─── Email helpers ───────────────────────────────────────────────────────────

export function normalizeEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return email;
  return `${email.slice(0, atIndex)}@${email.slice(atIndex + 1).toLowerCase()}`;
}

// ─── Field validators ────────────────────────────────────────────────────────

function validateName(value: string): ValidationError | null {
  const trimmed = value.trim();
  if (!trimmed) return { field: "name", message: "Name is required." };
  if (trimmed.length < NAME_MIN)
    return { field: "name", message: `Name must be at least ${NAME_MIN} characters.` };
  if (trimmed.length > NAME_MAX)
    return { field: "name", message: `Name must be ${NAME_MAX} characters or fewer.` };
  if (hasExcessiveRepeatedChars(trimmed))
    return { field: "name", message: "Please enter a valid name." };
  return null;
}

function validateEmail(value: string): ValidationError | null {
  const trimmed = value.trim();
  if (!trimmed) return { field: "email", message: "Email is required." };
  if (trimmed.length > EMAIL_MAX) return { field: "email", message: "Email address is too long." };
  if (!EMAIL_REGEX.test(trimmed))
    return { field: "email", message: "Please enter a valid email address." };
  return null;
}

function validateIntent(value: string): ValidationError | null {
  const trimmed = value.trim();
  if (!trimmed) return { field: "intent", message: "Please select what this is about." };
  if (!(INTENT_OPTIONS as readonly string[]).includes(trimmed)) {
    return { field: "intent", message: "Please select a valid option." };
  }
  return null;
}

function validateMessage(value: string): ValidationError | null {
  const trimmed = value.trim();
  if (!trimmed) return { field: "message", message: "Message is required." };
  if (trimmed.length < MESSAGE_MIN)
    return {
      field: "message",
      message: `Message must be at least ${MESSAGE_MIN} characters.`,
    };
  if (trimmed.length > MESSAGE_MAX)
    return {
      field: "message",
      message: `Message must be ${MESSAGE_MAX} characters or fewer.`,
    };
  if (hasExcessiveRepeatedChars(trimmed))
    return {
      field: "message",
      message: "Message appears to contain excessive repeated characters.",
    };
  if (isKeyboardSpam(trimmed))
    return {
      field: "message",
      message: "Message appears to be a keyboard pattern. Please write a meaningful message.",
    };
  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Validate all contact-form fields from a raw input map.
 * Pure function — no side effects.
 */
export function validateContactForm(raw: Record<string, unknown>): ValidationResult {
  // Reject non-string field types early: String() coerces arrays/numbers
  // (e.g. [1,2,3] → "1,2,3", 123 → "123"), silently breaking the form's
  // string-field contract.
  const errors: ValidationError[] = [];

  if (typeof raw.name !== "string")
    errors.push({ field: "name", message: "Name must be plain text." });
  if (typeof raw.email !== "string")
    errors.push({ field: "email", message: "Email must be plain text." });
  if (typeof raw.intent !== "string")
    errors.push({ field: "intent", message: "Invalid intent format." });
  if (typeof raw.message !== "string")
    errors.push({ field: "message", message: "Message must be plain text." });

  if (errors.length > 0) {
    return { valid: false, errors, data: { name: "", email: "", intent: "", message: "" } };
  }

  const name = raw.name as string;
  const email = raw.email as string;
  const intent = raw.intent as string;
  const message = raw.message as string;

  const nameErr = validateName(name);
  if (nameErr) errors.push(nameErr);

  const emailErr = validateEmail(email);
  if (emailErr) errors.push(emailErr);

  const intentErr = validateIntent(intent);
  if (intentErr) errors.push(intentErr);

  const messageErr = validateMessage(message);
  if (messageErr) errors.push(messageErr);

  return {
    valid: errors.length === 0,
    errors,
    data: {
      name: name.trim(),
      email: normalizeEmail(email.trim()),
      intent: intent.trim(),
      message: message.trim(),
    },
  };
}
