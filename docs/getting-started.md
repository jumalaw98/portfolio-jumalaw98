# Getting Started

## Prerequisites

- **Node.js 22** — see `.nvmrc` (use `nvm use` or `nvm install 22` if using
  [nvm](https://github.com/nvm-sh/nvm))
- **npm** — comes with Node.js
- **Git**
- A [Hashnode](https://hashnode.com/) publication (optional — blog falls back
  to placeholder posts without it)
- A [Resend](https://resend.com/) API key (optional — contact form degrades
  gracefully without it)
- An [Upstash Redis](https://upstash.com/) instance (optional — rate limiter
  falls back to in-memory without it)

---

## Installation

```bash
# Clone the repository
git clone https://github.com/jumalaw98/portfolio-jumalaw98.git
cd portfolio-jumalaw98

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.local.example` to `.env.local`. All variables are optional for local
development — the application degrades gracefully without any of them.

### Required for production

| Variable                 | Description                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`   | Canonical URL. Used in sitemaps, OG metadata, and canonical links. Falls back to `https://jumalaw98.vercel.app`. |
| `RESEND_API_KEY`         | Resend API key for contact form email delivery. Without it, submissions return `503` in production.              |
| `CONTACT_RECEIVER_EMAIL` | Email where contact submissions are sent. Falls back to `jumalawrence98@gmail.com`.                              |

### Optional — blog integration

| Variable                    | Description                                                                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HASHNODE_PUBLICATION_HOST` | Your Hashnode publication hostname (e.g. `jumalaw98.hashnode.dev`). When set, `/blog` fetches posts from Hashnode's RSS feed. When unset, placeholder posts are shown. |

### Optional — rate limiting

| Variable                   | Description                                                                       |
| -------------------------- | --------------------------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST URL. Enables shared rate limiting across all server instances. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token.                                                         |

### Optional — monitoring

| Variable              | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `MONITOR_EMAIL_TO`    | Email for contact form monitoring alerts. Requires `RESEND_API_KEY`. |
| `MONITOR_EMAIL_FROM`  | Sender address for monitoring emails.                                |
| `MONITOR_WEBHOOK_URL` | Discord or Slack webhook URL for real-time monitoring events.        |

### Optional — analytics

| Variable                       | Description                                                             |
| ------------------------------ | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Domain for Plausible analytics integration (not yet wired into the UI). |

> **Note:** `next/font/google` fetches fonts from `fonts.googleapis.com` at
> build time. This works in local dev, CI, and on Vercel. It will fail in
> sandboxed or offline environments.

---

## Quick Start Checklist

```bash
# 1. Verify Node.js version
node --version   # should be 22.x

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.local.example .env.local

# 4. Verify TypeScript compiles
npm run typecheck

# 5. Verify linting
npm run lint

# 6. Start developing
npm run dev
```

---

## First-Time Build

```bash
npm run build
```

The build runs type checking, format checking, and linting before compiling the
Next.js production bundle. On first run, this may take 60–90 seconds depending
on your machine.
