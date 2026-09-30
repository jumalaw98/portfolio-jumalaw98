/**
 * Header-safe email "mailbox" handling (`Display Name <address@example.com>`).
 *
 * Why this module exists
 * ----------------------
 * Email headers are line oriented: a CR or LF inside a header value terminates
 * that header and starts a new one, so any value that ends up in an outbound
 * message (`from`, `reply_to`, `subject`, …) must be checked for control
 * characters before it is handed to the mail provider. That is *header
 * injection*, and the correct control is rejection/normalisation of control
 * characters — **not** HTML escaping, because a header is not markup.
 *
 * Payloads reaching this module have two very different origins:
 *   - operator configuration: `CONTACT_SENDER_FROM`, `MONITOR_EMAIL_FROM`;
 *   - untrusted user input: the contact form's validated `name` / `email`
 *     (see src/lib/validation.ts, which reuses `isEmailAddress` here).
 *
 * Both are treated the same way: parse, reject anything that could break out of
 * a header, then re-serialise from the parsed parts. A rejected value never
 * reaches a mail API — callers fall back to a known-good default or fail the
 * request.
 */

/** C0 controls (CR, LF, TAB, …) plus DEL — the characters a header must not contain. */
const UNSAFE_HEADER_CHARS = /[\u0000-\u001f\u007f]/;

/** Longest mailbox this module accepts (address limit is 254 characters). */
export const MAILBOX_MAX_LENGTH = 320;

/** Longest display name accepted, matching the contact form's NAME_MAX. */
export const MAILBOX_NAME_MAX_LENGTH = 100;

/**
 * Structural address validation. Deliberately stricter than the form
 * validator: header values additionally require a dotted domain and must not
 * contain whitespace or control characters.
 */
const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export interface Mailbox {
  /** Display name; empty string when the mailbox has none. */
  readonly name: string;
  /** Bare address, e.g. `onboarding@resend.dev`. */
  readonly address: string;
}

/** True when `value` contains a character that would break a mail header line. */
export function hasUnsafeHeaderChars(value: string): boolean {
  return UNSAFE_HEADER_CHARS.test(value);
}

/** True when `value` is a syntactically valid, header-safe bare address. */
export function isEmailAddress(value: string): boolean {
  if (value.length === 0 || value.length > MAILBOX_MAX_LENGTH) return false;
  if (hasUnsafeHeaderChars(value)) return false;
  return EMAIL_ADDRESS_PATTERN.test(value);
}

/**
 * Parse `Display Name <address@example.com>` or a bare `address@example.com`.
 *
 * @param raw - Operator configuration or already-validated user input
 * @returns The parsed mailbox, or `null` when the value is not a safe mailbox
 *          (control characters, unbalanced angle brackets, invalid address)
 */
export function parseMailbox(raw: string): Mailbox | null {
  if (hasUnsafeHeaderChars(raw)) return null;
  if (raw.length > MAILBOX_MAX_LENGTH) return null;

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const angleMatch = /^(.*?)<([^<>]*)>$/.exec(trimmed);

  if (!angleMatch) {
    // Bare address form.
    if (!isEmailAddress(trimmed)) return null;
    return { name: "", address: trimmed };
  }

  const address = angleMatch[2].trim();
  if (!isEmailAddress(address)) return null;

  const name = angleMatch[1].trim();
  if (name.length > MAILBOX_NAME_MAX_LENGTH) return null;
  // A name that contains quotes or angle brackets cannot be re-serialised
  // unambiguously, so it is rejected instead of guessed at.
  if (/[<>"]/.test(name)) return null;

  return { name, address };
}

/**
 * Serialise a mailbox for a mail header.
 *
 * @param mailbox - Parsed mailbox
 * @returns `Display Name <address>` or the bare address when unnamed
 */
export function formatMailbox(mailbox: Mailbox): string {
  if (mailbox.name === "") return mailbox.address;
  return `${mailbox.name} <${mailbox.address}>`;
}

/**
 * Parse configuration and either return it normalised or fall back.
 *
 * @param raw - Raw configuration value
 * @param fallback - Known-good default used when `raw` is missing/invalid
 * @returns The normalised mailbox string
 */
export function normalizeMailbox(raw: string | undefined, fallback: string): string {
  const parsed = parseMailbox(raw ?? "") ?? parseMailbox(fallback);
  if (!parsed) {
    throw new Error("Mailbox configuration is invalid and the fallback is unusable.");
  }
  return formatMailbox(parsed);
}
