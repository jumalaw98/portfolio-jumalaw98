# Security

## Overview

The project implements defense-in-depth across multiple layers: HTTP headers,
build-time hardening, input validation, rate limiting, spam detection, and
monitoring. No secrets are ever hardcoded — all configuration comes from
environment variables.

---

## HTTP Security Headers

Configured in `next.config.ts` and applied to all routes via
`async headers()`:

| Header                       | Value                                                          | Purpose                                      |
| ---------------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| `Content-Security-Policy`    | Restrictive policy (see below)                                 | Prevents XSS and data injection              |
| `Strict-Transport-Security`  | `max-age=31536000; includeSubDomains`                          | Enforces HTTPS for one year                  |
| `X-Frame-Options`            | `DENY`                                                         | Prevents clickjacking                        |
| `X-Content-Type-Options`     | `nosniff`                                                      | Prevents MIME-type sniffing                  |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                              | Privacy-preserving referrer                  |
| `Permissions-Policy`         | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Disables unused browser features             |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups`                                     | Cross-origin isolation (allows social links) |

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://images.unsplash.com https://ik.imagekit.io https://cdn.hashnode.com blob:;
font-src 'self' https://fonts.gstatic.com data:;
connect-src 'self' https://api.resend.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

- `'unsafe-inline'` is required for Next.js hydration scripts, Framer Motion
  inline styles, and Google Fonts loader.
- In development, `'unsafe-eval'` is added (Next.js hot-reload requires it).
  Production omits it to block eval-based script gadgets.
- `frame-ancestors 'none'` prevents embedding the site in iframes.
- `form-action 'self'` restricts form submissions to the same origin.
- Image sources are scoped to the specific CDNs the site uses.

---

## Build Hardening

| Measure                   | Configuration                        | Effect                                |
| ------------------------- | ------------------------------------ | ------------------------------------- |
| Remove `X-Powered-By`     | `poweredByHeader: false`             | Hides Next.js version from attackers  |
| Disable source maps       | `productionBrowserSourceMaps: false` | Production source maps are not served |
| Remove `.env` from builds | `.gitignore` + `.vercel` ignore      | Secrets never leave local/CI          |

---

## Contact Form Security

### Rate Limiting

- **Algorithm:** Sliding window (avoids boundary bursts of fixed windows).
- **Limit:** 5 submissions per hour per IP.
- **Backend:** Upstash Redis (`@upstash/ratelimit`) with sliding window.
- **Ephemeral cache:** Blocked IPs are cached up to 10,000 entries — rejected
  without any Redis call.
- **Fallback:** In-memory `BoundedMap` limiter when Redis is not configured
  (with a warning logged in production).
- **Analytics:** Upstash analytics enabled when Redis is configured.

### Honeypot

- A hidden form field (`_hp_`) that is invisible to humans but visible to bots.
- When the field is non-empty, the submission is silently accepted (200 OK)
  but never delivered or stored — the bot cannot distinguish a successful
  submission from a blocked one.

### Spam Detection

- **Repeated character detection:** Flags if any single character makes up
  ≥70% of the string (e.g. "aaaaaa").
- **Keyboard mashing detection:** Flags if ≥80% of letter characters belong
  to a single QWERTY keyboard row (e.g. "asdfghjk").

### Server-Side Validation

All form fields are validated server-side using the same pure-function
`validateContactForm()` that the client uses:

| Field     | Rules                                                |
| --------- | ---------------------------------------------------- |
| `name`    | Required, 2–100 chars                                |
| `email`   | Required, max 254 chars, RFC 5322 structural pattern |
| `intent`  | Required, must be one of `INTENT_OPTIONS`            |
| `message` | Required, 20–2000 chars                              |

Type checking is strict: non-string values (e.g. arrays, numbers) are
rejected early to prevent coercion-based bypass.

### IP Resolution

- Reads `X-Forwarded-For` (first IP in comma-separated list) or `X-Real-IP`.
- Returns `null` when no trusted header is present — requests without a
  resolvable IP are rejected (429), not silently collapsed under a shared
  `"unknown"` key.

### Idempotent Submissions

- Each submission carries a `submissionId` (UUID).
- Passed to Resend as the `Idempotency-Key` header.
- Prevents duplicate email sends on network retry.

---

## Dependency Security

### npm Audit

- `npm audit --audit-level=high` runs in CI on every PR.
- Only high and critical severity vulnerabilities cause a warning.
- Found issues are displayed in the CI summary but do not fail the build
  (informational).

### Dependabot

- Checks npm dependencies daily for available updates.
- Groups non-breaking updates into single PRs to reduce noise.
- Breaking changes receive individual PRs.
- GitHub Actions workflow files checked weekly.

### CodeQL Analysis

- Runs on every PR and push to `main`, plus a weekly scheduled scan.
- Analyzes JavaScript/TypeScript for security vulnerabilities.
- Runs with `fail-fast: false` to complete all scans even if one fails.
- Results uploaded as SARIF artifacts for review.

---

## Error Handling

- **No stack traces leaked:** User-facing errors are generic messages
  ("Something went wrong. Please try again or email directly.").
- **Structured server-side logging:** All errors are logged as JSON with
  correlation IDs (see `docs/architecture.md` → instrumentation).
- **Webhook/email alerts:** Optional alert channels for abuse events without
  exposing system internals.

---

## CORS

- CORS is not explicitly configured — the application serves requests from its
  own origin only.
- `form-action 'self'` in CSP restricts form submissions to the same origin.
- The contact form API is a same-origin POST endpoint.

---

## Secrets Management

- **No secrets in source code** — all keys and tokens come from environment
  variables.
- **`.env.local` is in `.gitignore`** — never committed.
- **`.env.local.example` is committed** — serves as a documented reference
  template with placeholder values.
- **Only production secrets** on Vercel's environment variable dashboard.
