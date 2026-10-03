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

## Content Trust Boundaries

Three kinds of content cross into this site, and each has exactly one enforced entry point.

### 1. External HTML (Hashnode RSS) → `SanitizedHtml`

`src/lib/html-sanitize.ts` is the only module that produces the nominal type
`SanitizedHtml`. `sanitizeExternalHtml()` runs `sanitize-html` with an allowlist
of article elements/attributes/schemes and returns the branded value.

| Consumer                         | How it stays safe                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| `lib/hashnode/posts.ts`          | Sanitizes `content:encoded` from the RSS feed                                          |
| `content/blog-placeholder.ts`    | Passes author-written placeholder markup through the same sanitizer (uniform boundary) |
| `components/blog/ArticleContent` | Prop is typed `SanitizedHtml`; a raw `string` is a compile error                       |

`ArticleContent` renders via `dangerouslySetInnerHTML` and highlights code
blocks with Prism after paint. The post-render effect takes the `html` payload
and a `contentId` (the slug) as its re-highlight triggers and reads the DOM
through a ref — it never reads or transforms the payload itself, so updated
HTML for the same slug (e.g. after `router.refresh()`) is re-highlighted too.

### 2. Structured data → `serializeJsonLd()`

`src/lib/json-ld.ts` is the only module that produces escaped JSON-LD, and
`components/seo/JsonLd` is its only consumer. It accepts plain structured data
(never `SanitizedHtml`) and renders `serializeJsonLd(data)` as the text child
of a `<script type="application/ld+json">` element — deliberately not through
`dangerouslySetInnerHTML`. React 19 renders text children of `<script>` as raw
text (no entity escaping, so the payload stays valid JSON for search engines)
and additionally neutralizes any `</script` sequence in the child.

Article titles/briefs come from an external feed, so `<` is still escaped to
`\u003c` by `serializeJsonLd()` as defence in depth — the payload remains
valid JSON (the escape is decoded by `JSON.parse` and by search engines) but
can no longer close the tag or open a new one, independently of React's own
script-child protection.

### 3. Compiled MDX → `CompiledMdxCode`

Velite emits MDX as a JavaScript _function body_, which must be evaluated before
React can render it. That evaluation is confined to one place:

- `src/lib/mdx/compiled-mdx.ts` defines the `CompiledMdxCode` brand and
  `asCompiledMdxCode()`, which validates artifact shape (string, non-empty,
  ≤5 MB, MDX function-body marker) and is the only producer of the brand.
- `src/lib/velite/index.ts` is the only caller: it brands the compiled body read
  from Velite's build output (`.velite/posts.json`, generated from the `.mdx`
  files committed to the repository). A post without a valid body fails loudly
  instead of rendering nothing.
- `components/blog/MdxContent.tsx` is `server-only` and evaluates the branded
  value — **the single permitted `new Function` in the codebase**. ESLint runs
  with `no-new-func` as an error, and this one line carries a narrow inline
  disable directive with its justification.

The artifact check is an integrity guard, **not a sandbox**: it cannot make
arbitrary JavaScript safe to run. Nor does the `CompiledMdxCode` type itself
prove provenance — the brand exists only at compile time and is erased at
runtime, and `asCompiledMdxCode()` brands any string containing the marker
regardless of its origin. Trust comes from the production call path instead:
`src/lib/velite/index.ts` is the only caller, and it supplies the compiled form
of the `.mdx` files committed to this repository. Removing runtime evaluation
entirely would mean replacing Velite's MDX output with a pre-compiled component
pipeline (e.g. `@next/mdx`) — an architectural change, tracked under _Known
limitations_ below.

---

## Filesystem Access in Content Scripts

`scripts/generate-summaries.ts`, `scripts/check-placeholders.ts` and
`scripts/find-ready-posts.ts` walk `src/content/blog/` and read every `.mdx`
file (summaries send the body to third-party AI APIs and write results back);
`scripts/publish-devto.ts` reads and rewrites a single
`src/content/blog/<slug>.mdx`. All of them confine every path to the repo tree
via `src/lib/safe-path.ts`:

| Control                               | Purpose                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `BLOG_DIR` from the script's own path | Scan and writes are pinned to the repo tree, not `process.cwd()`             |
| `listFilesWithinBase()`               | Every result re-checked by real path; symlinks and non-regular files skipped |
| `assertWithinBase()`                  | Lexical containment (`../`, absolute paths, sibling-prefix tricks rejected)  |
| `assertRealPathWithinBase()`          | Symlink-resolved containment, re-checked immediately before read and write   |

`listFilesWithinBase()` also asks `globSync` not to follow symlinked directories
(`followSymlinks: false`), but that is defence in depth, never the protection:
the option is not supported by every Node line these scripts can run on (Node 22
ignores it and walks into a linked directory), so what blocks an escape is the
real-path re-check applied to every result — and again immediately before each
read and write. A walk that does reach a link target therefore still yields
nothing that resolves outside the base directory.

Symlinks are the concrete risk: a symlinked `*.mdx` committed under
`src/content/blog/` would otherwise be read (disclosing the target file's
contents to the AI providers) and then overwritten. The blog root itself is
validated against the repository tree before listing, so a symlinked
`src/content/blog` cannot become its own trusted boundary. A containment
violation aborts the run (fail closed) rather than skipping quietly.

---

## Contact Form Response Handling

`src/lib/contact-form-errors.ts` parses the `/api/contact` error response
(untrusted input on the client):

- keys come from a fixed allowlist (`name`, `email`, `intent`, `message`);
  anything else — including `__proto__`, `constructor`, `prototype` — is ignored
- values must be non-empty strings, so no objects/arrays/numbers reach form state
- no dynamic key is written into an object: every assignment targets a named
  property, which removes the object-injection sink rather than trusting it
- regression tests: `src/lib/__tests__/contact-form-errors.test.ts`

---

## Known Limitations and Accepted Scanner Findings

| Item                                                                           | Status                                                                                                                                                                      |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new Function` in `MdxContent.tsx`                                             | Accepted. Inherent to MDX's function-body output; branded + shape-validated + one documented exception. See _Content Trust Boundaries_.                                     |
| Non-literal paths in `readFileSync`/`writeFileSync`                            | Accepted. The set of files is data, so a literal path is impossible; containment is enforced by real-path checks instead. Reported only by the removed eslint-8 engine.     |
| Object-injection reports on closed-union keys                                  | Resolved by implementation change (`Map.get`, explicit `switch`), so no rule suppression is used.                                                                           |
| `'unsafe-inline'` in `script-src`                                              | Accepted and documented in `next.config.ts`; removing it requires nonce-based CSP via middleware.                                                                           |
| Sanitizer fixtures in `src/lib/__tests__/html-sanitize.test.ts`                | Resolved. No exclusion needed: eslint-8 was removed from `codacy.config.json` and `exclude_paths` retired in `.codacy.yaml`; Semgrep flags nothing here.                    |
| `dangerouslySetInnerHTML` reports on `components/seo/JsonLd`                   | Resolved by implementation change (script text child instead of `dangerouslySetInnerHTML`; `serializeJsonLd()` escaping retained), so no rule suppression is used.          |
| "Unencoded return value used in HTML context" on `content/blog-placeholder.ts` | Accepted. The reported value is already sanitized through the `SanitizedHtml` boundary (see _Content Trust Boundaries_); the removed eslint-8 engine was the only reporter. |

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
