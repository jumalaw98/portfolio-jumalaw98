/**
 * Upstash Redis-backed rate limiters for the contact form.
 *
 * Uses sliding-window algorithm for smooth request distribution.
 * Ephemeral cache avoids Redis calls for already-blocked identifiers.
 *
 * Requires environment variables:
 *   UPSTASH_REDIS_REST_URL   — from Upstash Console → Redis database → REST API
 *   UPSTASH_REDIS_REST_TOKEN — from Upstash Console → Redis database → REST API
 *
 * When those variables are absent (e.g. local dev without Upstash) the module
 * falls back to a lightweight in-memory limiter so the contact endpoint stays
 * functional without external configuration.
 *
 * Pricing: Free tier (500K commands/month, 256 MB) is sufficient for
 * a portfolio site. Each `limit()` call can use up to six Redis commands,
 * including the additional analytics command.
 *
 * @see https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Ephemeral cache ─────────────────────────────────────────────────────────

/** Max entries in the ephemeral cache to prevent attacker-controlled key growth. */
const EPHEMERAL_CACHE_MAX = 10_000;

/**
 * Bounded in-memory cache for already-blocked identifiers.
 * Evicts the oldest entry when full, preventing attacker-controlled IP
 * rotation from growing memory or scan-time CPU unboundedly.
 * Module-scoped so it survives warm lambda invocations.
 */
class BoundedMap<K, V> extends Map<K, V> {
  constructor(private readonly maxSize: number) {
    super();
  }

  set(key: K, value: V): this {
    if (this.size >= this.maxSize && !this.has(key)) {
      const firstKey = this.keys().next().value;
      if (firstKey !== undefined) this.delete(firstKey);
    }
    return super.set(key, value);
  }
}

const ephemeralCache = new BoundedMap<string, number>(EPHEMERAL_CACHE_MAX);

// ─── In-memory fallback limiter ───────────────────────────────────────────────

/** Sliding-window state stored per identifier in the in-memory fallback. */
interface WindowState {
  count: number;
  resetAt: number;
}

const FALLBACK_LIMIT = 5;
const FALLBACK_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Bounded store for the in-memory fallback to mirror the ephemeral-cache cap. */
const fallbackStore = new BoundedMap<string, WindowState>(EPHEMERAL_CACHE_MAX);

/**
 * Minimal in-memory rate limiter that matches the `contactLimiter.limit()`
 * return shape. Used when Upstash env vars are not configured.
 */
const inMemoryLimiter = {
  limit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    pending: Promise<unknown>;
  }> {
    const now = Date.now();
    const state = fallbackStore.get(identifier);

    if (state && now < state.resetAt) {
      const remaining = Math.max(0, FALLBACK_LIMIT - state.count - 1);
      if (state.count >= FALLBACK_LIMIT) {
        return Promise.resolve({
          success: false,
          limit: FALLBACK_LIMIT,
          remaining: 0,
          reset: state.resetAt,
          pending: Promise.resolve(),
        });
      }
      fallbackStore.set(identifier, { count: state.count + 1, resetAt: state.resetAt });
      return Promise.resolve({
        success: true,
        limit: FALLBACK_LIMIT,
        remaining,
        reset: state.resetAt,
        pending: Promise.resolve(),
      });
    }

    const resetAt = now + FALLBACK_WINDOW_MS;
    fallbackStore.set(identifier, { count: 1, resetAt });
    return Promise.resolve({
      success: true,
      limit: FALLBACK_LIMIT,
      remaining: FALLBACK_LIMIT - 1,
      reset: resetAt,
      pending: Promise.resolve(),
    });
  },
};

// ─── Limiter construction ─────────────────────────────────────────────────────

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const isRedisConfigured = Boolean(REDIS_URL && REDIS_TOKEN);

if (!isRedisConfigured && process.env.NODE_ENV === "production") {
  // Fail loudly rather than silently degrading to per-instance in-memory
  // limiting, which would allow the hourly cap to be exceeded proportionally
  // to the number of running instances.
  console.error(
    JSON.stringify({
      event: "rate_limit.config_error",
      message:
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production. " +
        "Rate limiting will not function correctly without a shared Redis store.",
    }),
  );
  throw new Error(
    "Rate limiter configuration error: Upstash Redis env vars are required in production.",
  );
}

/**
 * Contact form rate limiter: 5 submissions per hour per IP.
 *
 * Sliding window avoids the boundary-burst issue of fixed windows.
 * The ephemeral cache means blocked IPs are rejected without any Redis call.
 *
 * Falls back to an in-memory limiter when Redis env vars are not set, keeping
 * the endpoint usable in local development without external configuration.
 */
export const contactLimiter: Pick<Ratelimit, "limit"> = isRedisConfigured
  ? new Ratelimit({
      redis: new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! }),
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "rl:contact",
      ephemeralCache,
    })
  : inMemoryLimiter;

// ─── IP resolution ───────────────────────────────────────────────────────────

/**
 * Extract the client IP address from a Next.js/standard Request.
 *
 * Returns `null` when no trusted peer/proxy header is present so callers
 * can decide how to handle an unresolvable address, rather than silently
 * collapsing every headerless request under a shared `"unknown"` key that
 * would cause all such users to share a single rate-limit bucket.
 */
export function getClientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

export type { Ratelimit };
