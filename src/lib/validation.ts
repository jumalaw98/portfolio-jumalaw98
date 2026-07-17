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

/**
 * Patterns whose repetition is a strong spam signal.
 * Only 4+ char patterns to avoid false positives on short substrings.
 */
const SPAM_PATTERNS = [
  /asdf/,
  /qwerty/,
  /zxcv/,
  /1234/,
  /2345/,
  /3456/,
  /4567/,
  /5678/,
  /6789/,
  /7890/,
];

/** Individual QWERTY keyboard rows (number, top, home/middle, bottom). */
const NUMBER_ROW = new Set("1234567890");
const TOP_ROW = new Set("qwertyuiop");
const MIDDLE_ROW = new Set("asdfghjkl");
const BOTTOM_ROW = new Set("zxcvbnm");
const KEYBOARD_ROWS = [TOP_ROW, MIDDLE_ROW, BOTTOM_ROW, NUMBER_ROW];

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
  const cleaned = value.toLowerCase().replace(/\s+/g, "");
  if (cleaned.length < 4) return false;

  // Check if the majority of characters belong to a single keyboard row
  // (catches keyboard mashing like "asdfghjkl" or "qwertyqwerty")
  for (const row of KEYBOARD_ROWS) {
    const rowChars = [...cleaned].filter((c) => row.has(c)).length;
    if (rowChars / cleaned.length >= 0.8) return true;
  }

  // Message is a repetition of a known spam pattern
  for (const pattern of SPAM_PATTERNS) {
    const match = cleaned.match(pattern);
    if (!match || match.index !== 0) continue;

    const matched = match[0];
    const repeats = Math.ceil(cleaned.length / matched.length);
    const expected = matched.repeat(repeats).slice(0, cleaned.length);
    if (cleaned === expected) return true;
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
  const name = String(raw.name ?? "");
  const email = String(raw.email ?? "");
  const intent = String(raw.intent ?? "");
  const message = String(raw.message ?? "");

  const errors: ValidationError[] = [];

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
