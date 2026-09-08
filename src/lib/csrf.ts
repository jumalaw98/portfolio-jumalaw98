/**
 * Origin / Referer validation for CSRF protection on stateless API endpoints.
 *
 * This module provides lightweight CSRF protection for public forms that
 * use JSON fetch requests (Content-Type: application/json triggers CORS
 * preflight), but adds defense-in-depth via Origin/Referer header checks.
 *
 * No session, no cookies, no tokens — just header validation.
 */

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const origins: string[] = [];

  if (siteUrl) {
    // Normalise: strip trailing slash
    origins.push(siteUrl.replace(/\/+$/, ""));
  }

  // Always allow the default Vercel deployment
  origins.push("https://jumalaw98.vercel.app");

  // Deduplicate
  return [...new Set(origins)];
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
    // Strip trailing slash for comparison
    const normalised = origin.replace(/\/+$/, "");
    if (allowedOrigins.includes(normalised)) {
      return { ok: true };
    }
    return { ok: false, reason: `Origin "${origin}" not in allowlist` };
  }

  // Fallback: Referer header
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      if (allowedOrigins.includes(refererOrigin)) {
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
