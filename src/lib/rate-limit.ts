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
 * Pricing: Free tier (500K commands/month, 256 MB) is sufficient for
 * a portfolio site. Each `limit()` call can use up to six Redis commands,
 * including the additional analytics command.
 *
 * @see https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

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

/**
 * Contact form rate limiter: 5 submissions per hour per IP.
 *
 * Sliding window avoids the boundary-burst issue of fixed windows.
 * The ephemeral cache means blocked IPs are rejected without any Redis call.
 */
export const contactLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "rl:contact",
  ephemeralCache,
});

/**
 * Extract the client IP address from a Next.js/standard Request.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export type { Ratelimit };
