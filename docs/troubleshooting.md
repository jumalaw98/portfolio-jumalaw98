# Troubleshooting

## `next/font/google` fails at build time

The font loader needs internet access to fetch from `fonts.googleapis.com`.
This works automatically in local dev, CI, and Vercel. It will fail in
sandboxed or offline environments.

**Fix:** Ensure your build environment has outbound internet access. For
offline builds, consider pre-downloading the font files or using a fallback
system font.

---

## Contact form returns 503 in production

`RESEND_API_KEY` is not set. The API key is required for email delivery in
production.

**Fix:** Set `RESEND_API_KEY` in your Vercel project's environment variables.
Verify the key is valid by checking the Resend dashboard.

---

## Blog shows placeholder posts

`HASHNODE_PUBLICATION_HOST` is not set or the Hashnode RSS fetch failed.

**Fix:** Set `HASHNODE_PUBLICATION_HOST` to your Hashnode publication hostname
(e.g. `jumalaw98.hashnode.dev`). The RSS feed URL is constructed as
`https://{host}/rss.xml`. Verify the feed is accessible at that URL.

Placeholder posts are shown with an orange notice banner. The site functions
fully with placeholders — they include realistic content for testing all blog
features.

---

## Rate limiter not working across instances

`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set. Without
Redis, the rate limiter uses per-instance in-memory state.

**Problem:** If Vercel runs multiple serverless function instances, each
instance has its own rate limit counter. A user hitting 5 requests across 3
instances would not be blocked.

**Fix:** Set both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from
your Upstash Redis dashboard. The free tier (500K commands/month) is sufficient
for a portfolio site.

**Note:** A warning is logged in production when Redis is not configured. The
in-memory fallback still provides basic abuse protection.

---

## Build fails with TypeScript errors

```bash
npm run typecheck
```

Run this locally to see all errors before building. The `build` script runs
`typecheck` automatically, but running it separately gives faster feedback
during development.

**Common causes:**

- Missing types for a new dependency (`npm install -D @types/...`).
- Incorrect path alias usage (use `@/` prefix, e.g. `@/components/...`).
- `any` type accidentally introduced (the project uses strict mode).

---

## Prettier formatting conflicts

```bash
npm run format
```

Auto-fix all formatting issues, then commit. The CI pipeline checks formatting
and will block PRs with violations.

**Common causes:**

- Editor not configured to format on save with Prettier.
- Editor using a different default formatter (ensure `.prettierrc` is
  recognized).
- Line ending issues on Windows (the project uses `lf` — configure Git with
  `git config --global core.autocrlf input`).

---

## ESLint errors after adding a new file

The project uses `eslint.config.mjs` (flat config). All `.ts` and `.tsx` files
under `src/` are linted automatically.

**Fix:** Ensure new files are within `src/` and have valid TypeScript. Check
that the file follows the project's coding conventions (see
`docs/coding-standards.md`).

---

## Image optimization failing in dev

`next/image` requires the Next.js server for optimization. In production on
Vercel, images are optimized by Vercel's image optimization service.

**Fix:** Ensure you're running `npm run dev` (or `next dev`), not just serving
static files. Image optimization is a server feature, not available in static
exports.

---

## Honeypot field triggering for legitimate users

The honeypot field (`_hp_`) is hidden with CSS (`absolute left-[-9999px]`).
Some browser extensions (password managers, form fillers) may auto-fill it.

**Fix:** This is rare but possible. The submission is silently accepted (200 OK)
but not delivered — the user sees a success message. If this happens frequently,
the `_hp_` field name can be randomized per session.

---

## Contact form timeout (504)

The Resend API request has a 10-second timeout. This can happen when:

- The Resend API is experiencing degraded performance.
- The network between Vercel and Resend is slow.

**Fix:** The user sees a friendly error message and is asked to try again or
email directly. The event is logged for monitoring. No action is typically
needed unless it persists.

---

## Hashnode RSS feed fetch fails

A transient failure is handled gracefully — ISR retains the last successful
cached response. A banner is shown to inform users:

> "We couldn't load the latest posts from Hashnode right now."

**Monitor:** Check `HASHNODE_PUBLICATION_HOST` is correct. Verify the RSS feed
at `https://{host}/rss.xml` is accessible. Check Vercel Logs for
`hashnode-posts` revalidation errors.

---

## NPM audit warnings in CI

The `audit` job in CI uses `--audit-level=high` and `continue-on-error: true`.
High/critical severity findings produce warnings but do not fail the build.

**Action:** Review the findings in the CI job's summary. If a finding is a
false positive or already addressed, suppress it with an `override` in
`package.json`. If real, update the affected dependency.

---

## Branch protection prevents merge

The `main` branch has protection rules requiring passing CI checks. If a PR
fails a required check:

1. Check the failing job's logs in the Actions tab.
2. Fix the issue and push a new commit.
3. CI re-runs automatically.

Required checks: `Code Quality`, `TypeScript`, `Dependency Audit`, `Build`.
