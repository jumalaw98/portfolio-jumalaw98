/**
 * Origin / Referer validation for CSRF protection on stateless API endpoints.
 *
 * This module provides lightweight CSRF protection for public forms that
 * use JSON fetch requests (Content-Type: application/json triggers CORS
 * preflight), but adds defense-in-depth via Origin/Referer header checks.
 *
 * No session, no cookies, no tokens — just header validation.
 */

import "server-only";

/**
 * Result of origin validation.
 */
export interface OriginCheckResult {
  ok: boolean;
  reason?: string;
}

/**
 * Allowed origins for the contact form API.
 * Derived from NEXT_PUBLIC_SITE_URL at module scope.
 */
function getAllowedOrigins(): string[] {
  // URL.origin canonicalizes casing, default ports, and any configured path.
  // Fall back only when no site URL is configured; a custom deployment must
  // not keep an old deployment origin trusted indefinitely.
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jumalaw98.vercel.app";
  try {
    return [new URL(configuredUrl).origin];
  } catch {
    return [];
  }
}

function normaliseOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isDevelopmentOrigin(origin: string): boolean {
  if (process.env.NODE_ENV !== "development") return false;

  try {
    const url = new URL(origin);
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Validate that the request originated from a trusted origin.
 *
 * Checks:
 *   1. Origin header (present on cross-origin requests)
 *   2. Referer header (fallback if Origin is absent)
 *
 * Returns `{ ok: true }` if the request passes validation.
 * Returns `{ ok: false, reason }` if rejected.
 */
export function validateOrigin(request: Request): OriginCheckResult {
  const allowedOrigins = getAllowedOrigins();

  // Try Origin header first
  const origin = request.headers.get("origin");
  if (origin) {
    const normalised = normaliseOrigin(origin);
    if (normalised && (allowedOrigins.includes(normalised) || isDevelopmentOrigin(normalised))) {
      return { ok: true };
    }
    return { ok: false, reason: `Origin "${origin}" not in allowlist` };
  }

  // Fallback: Referer header
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (allowedOrigins.includes(refererOrigin) || isDevelopmentOrigin(refererOrigin)) {
        return { ok: true };
      }
      return { ok: false, reason: `Referer origin "${refererOrigin}" not in allowlist` };
    } catch {
      return { ok: false, reason: "Invalid Referer header" };
    }
  }

  // No Origin and no Referer — reject.
  // Legitimate browser form submissions include Origin or Referer.
  // Missing both indicates a non-browser client (curl, script, bot).
  return { ok: false, reason: "Missing both Origin and Referer headers" };
}
