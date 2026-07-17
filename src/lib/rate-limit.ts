/**
 * Simple in-memory rate limiter for the contact form.
 *
 * Limits to MAX_REQUESTS per WINDOW_MS per IP address.
 *
 * NOTE: On serverless platforms (Vercel, Netlify) instances are ephemeral,
 * so the in-memory store resets between cold starts. For production at scale,
 * replace the Map with a shared store such as Upstash Redis.
 *
 * For a portfolio site this is adequate — each instance maintains its own
 * counter, and the worst case is a few extra submissions during a redeploy.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;

// ─── Types ───────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ─── Internal store ──────────────────────────────────────────────────────────

const store = new Map<string, RateLimitEntry>();

// ─── Cleanup ─────────────────────────────────────────────────────────────────

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check whether `ip` is allowed to make a request.
 * Increments the counter if allowed.
 * Never throws.
 */
export function checkRateLimit(ip: string): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(ip);

  // First request or window expired — reset
  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  // Limit exceeded
  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Within limit — increment
  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt };
}
