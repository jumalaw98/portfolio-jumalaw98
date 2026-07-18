# API Routes

## Overview

The project exposes a single API route for the contact form. The RSS feed at
`/blog/rss.xml` is a route handler that returns static XML (see `routing.md`
for details).

---

## `POST /api/contact`

Contact form submission endpoint. Accepts JSON and delivers the message via
Resend email API.

### Request

**Content-Type:** `application/json`

```json
{
  "name": "string (2–100 chars)",
  "email": "string (valid email, max 254 chars)",
  "intent": "string (one of: 'Full-time opportunity', 'Freelance project', 'Speaking or partnership', 'Other')",
  "message": "string (20–2000 chars)",
  "_hp_": "string (honeypot — bots fill this, humans don't)",
  "submissionId": "string (UUID for idempotent retries)"
}
```

### Response

| Status                      | Condition                                       |
| --------------------------- | ----------------------------------------------- |
| `200 OK`                    | Message accepted and delivered                  |
| `400 Bad Request`           | Invalid JSON body                               |
| `422 Unprocessable Entity`  | Validation failed (field-level errors)          |
| `429 Too Many Requests`     | Rate limited (5/hour per IP)                    |
| `502 Bad Gateway`           | Resend API returned an error                    |
| `503 Service Unavailable`   | Resend API key not configured (production only) |
| `504 Gateway Timeout`       | Resend API request timed out (10s)              |
| `500 Internal Server Error` | Unexpected server error                         |

### Success Response (200)

```json
{ "ok": true, "delivered": true }
```

Honeypot-triggered submissions also return 200 (to avoid revealing the
honeypot to bots):

```json
{ "ok": true, "delivered": false }
```

### Error Responses

**Validation Error (422):**

```json
{
  "error": "Validation failed.",
  "fields": {
    "name": "Name is required.",
    "email": "Please enter a valid email address.",
    "message": "Message must be at least 20 characters."
  }
}
```

**Rate Limited (429):**

```json
{
  "error": "Too many submissions. Please try again later."
}
```

**Server Error (500):**

```json
{
  "error": "Something went wrong. Please try again or email directly."
}
```

### Headers

| Header                  | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `Retry-After`           | Present on 429 responses (seconds until rate limit resets) |
| `X-RateLimit-Limit`     | Maximum requests per window (5)                            |
| `X-RateLimit-Remaining` | Remaining requests in current window                       |
| `X-RateLimit-Reset`     | Unix timestamp when the window resets                      |

### Request Lifecycle

1. **IP resolution** — extracted from `X-Forwarded-For` or `X-Real-IP`.
   Requests without resolvable IP are rejected (429) to prevent bypass.
2. **Rate limiting** — sliding window (5 requests/hour per IP) via Upstash
   Redis (or in-memory fallback). Blocked IPs are cached in ephemeral cache
   for fast rejection without Redis calls.
3. **Honeypot check** — if `_hp_` is non-empty, the submission is silently
   accepted (200) but not delivered.
4. **Server-side validation** — all fields validated using the same
   `validateContactForm()` function used on the client. Returns field-level
   errors on failure.
5. **Email delivery** — sends via Resend API (`POST
https://api.resend.com/emails`) with a 10-second timeout and idempotency
   key (`submissionId`) to prevent duplicate sends on retry.
6. **Monitoring** — every event (rate limit hit, honeypot trigger, delivery
   success/failure, validation failure) is logged as a structured JSON entry
   and optionally sent to webhook and/or email alert channels.

### Environment Variables Required

| Variable                   | Purpose                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `RESEND_API_KEY`           | Resend API key (required in production)                              |
| `CONTACT_RECEIVER_EMAIL`   | Where to deliver the message (optional, falls back to lib/constants) |
| `UPSTASH_REDIS_REST_URL`   | Redis URL for shared rate limiting (optional, in-memory fallback)    |
| `UPSTASH_REDIS_REST_TOKEN` | Redis token (optional, in-memory fallback)                           |

### Example — cURL

```bash
curl -X POST https://jumalaw98.vercel.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "intent": "Full-time opportunity",
    "message": "Hi Lawrence, I came across your portfolio and would love to discuss a role at our company."
  }'
```

### Monitoring Events

| Event                        | Level | Trigger                       |
| ---------------------------- | ----- | ----------------------------- |
| `contact.rate_limit_hit`     | warn  | IP exceeded rate limit        |
| `contact.honeypot_triggered` | warn  | Bot filled honeypot field     |
| `contact.delivery_failed`    | error | Resend returned non-2xx       |
| `contact.delivery_timeout`   | warn  | Resend request timed out      |
| `contact.delivery_succeeded` | info  | Email delivered successfully  |
| `contact.validation_failed`  | info  | Server-side validation failed |
| `contact.unexpected_error`   | error | Unhandled exception           |

---

## `GET /blog/rss.xml`

Generated RSS 2.0 feed of blog posts.

- ISR with `revalidate = 3600`.
- Falls back to placeholder posts when Hashnode is not configured.
- Returns empty feed (not an error) on fetch failure when configured.

See `docs/routing.md` for full details.
