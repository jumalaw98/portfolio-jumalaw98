# Deployment

## Platform

The application is designed for and deployed on **Vercel**. The production URL
is `https://jumalaw98.vercel.app`.

---

## Deployment Flow

1. Push to `main` branch triggers automatic deployment via Vercel's GitHub
   integration.
2. CI runs all quality gates (`typecheck`, `format:check`, `lint`, build)
   before deployment proceeds.
3. Vercel builds the application and deploys to the production environment.

---

## Pre-Deployment Checklist

### Required

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production domain.
- [ ] Set `RESEND_API_KEY` and `CONTACT_RECEIVER_EMAIL` for contact form
      delivery.
- [ ] Set `HASHNODE_PUBLICATION_HOST` to connect the blog.
- [ ] Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for
      production-grade rate limiting.

### Recommended

- [ ] Set `MONITOR_EMAIL_TO` for email alerting on abuse/errors.
- [ ] Set `MONITOR_WEBHOOK_URL` for real-time Discord/Slack alerts.
- [ ] Verify `MONITOR_EMAIL_FROM` is set to a verified sending domain
      (Resend requires domain verification for production sender addresses).

### Optional

- [ ] Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` for analytics integration
      (not yet wired into the UI).

---

## Environment Variables on Vercel

All environment variables are configured in the Vercel project dashboard
(Project Settings → Environment Variables). They are set for the Production
environment:

| Variable                    | Production     | Preview/Dev                              |
| --------------------------- | -------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`      | Production URL | Preview URL (auto-set by Vercel)         |
| `RESEND_API_KEY`            | ✅             | ❌ (contact form returns 503 in preview) |
| `CONTACT_RECEIVER_EMAIL`    | ✅             | ❌                                       |
| `HASHNODE_PUBLICATION_HOST` | ✅             | ❌ (preview uses placeholder posts)      |
| `UPSTASH_REDIS_REST_URL`    | ✅             | ❌ (in-memory fallback in preview)       |
| `UPSTASH_REDIS_REST_TOKEN`  | ✅             | ❌                                       |
| `MONITOR_EMAIL_TO`          | ✅             | ❌                                       |
| `MONITOR_EMAIL_FROM`        | ✅             | ❌                                       |
| `MONITOR_WEBHOOK_URL`       | ✅             | ❌                                       |

---

## Build Configuration

The `next.config.ts` includes:

- **Bundle analyzer** — `@next/bundle-analyzer`, enabled via `ANALYZE=true`
  environment variable (not set in production).
- **Image remote patterns** — scoped to ImageKit, Unsplash, and Hashnode CDN.
- **Security headers** — applied to all routes.
- **Redirect** — `/resume` → `/about#resume`.
- **Server hardening** — `poweredByHeader: false`,
  `productionBrowserSourceMaps: false`.

---

## Vercel-Specific Notes

### Build Command

```
npm run build
```

Runs `typecheck` → `format:check` → `lint` → `next build`.

### Output Directory

Default (`.next`). No custom output directory is configured.

### Node.js Version

**22.x** — set in `.nvmrc` and configured in Vercel project settings.

### Functions

- The contact form API (`/api/contact`) runs as a Serverless Function.
- All pages are served via Vercel's Edge Network with ISR caching.

### ISR on Vercel

Blog routes use `revalidate = 3600` (1 hour). On Vercel:

- First request after deployment: rendered on the server, cached at the edge.
- Subsequent requests within 1 hour: served from edge cache.
- After 1 hour: stale cache served while revalidation happens in background.

### Monitoring

- Structured JSON logs (from `src/lib/instrument.ts`) appear in Vercel Logs
  dashboard.
- Webhook alerts (Discord/Slack) are optional via `MONITOR_WEBHOOK_URL`.
- Email alerts are optional via `MONITOR_EMAIL_TO` + `RESEND_API_KEY`.

---

## Alternative Deployment

While Vercel is the primary target, the application can be deployed to any
platform that supports Next.js 16:

1. Build: `npm run build`.
2. Start: `npm run start`.
3. Ensure environment variables are set in the target platform's dashboard
   or configuration.

Note: ISR and `next/image` optimization may behave differently outside of
Vercel. Check your platform's Next.js compatibility documentation.
