# Architecture

## Overview

jumalaw98-portfolio is a production-grade personal portfolio site built with
Next.js 16 (App Router) and React 19. It functions as a static + dynamic hybrid:
most pages are server-rendered React Server Components, with selective client
hydration for interactive elements (animations, contact form, blog search/filter).

The architecture follows a few core principles:

- **Server-first** — pages are Server Components by default; client JavaScript is
  shipped only for genuinely interactive leaf components.
- **Content as data** — all site content lives in `src/content/` as TypeScript
  data files, not in a CMS or database. Blog content is fetched at request time
  from Hashnode's public RSS feed.
- **Defence in depth** — security headers, rate limiting, input validation, and
  spam detection are layered into the request pipeline rather than bolted on.
- **Minimal dependencies** — each dependency earns its place. The entire site
  uses ~15 runtime dependencies (excluding dev tooling).

---

## System Context

```
┌─────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│   Browser   │────▶│   Next.js 16 (SSR)   │────▶│  Hashnode (RSS)  │
│ (User)      │     │   Vercel Edge        │     │  Blog Backend    │
└─────────────┘     │                      │     └──────────────────┘
                    │   ┌──────────────┐    │     ┌──────────────────┐
                    │   │ Server       │    │────▶│  Resend API      │
                    │   │ Components   │    │     │  (Contact Email) │
                    │   └──────────────┘    │     └──────────────────┘
                    │   ┌──────────────┐    │     ┌──────────────────┐
                    │   │ Client       │    │────▶│  Upstash Redis   │
                    │   │ Components   │    │     │  (Rate Limiting) │
                    │   └──────────────┘    │     └──────────────────┘
                    │   ┌──────────────┐    │
                    │   │ API Routes   │    │
                    │   │ /api/contact │    │
                    │   └──────────────┘    │
                    └──────────────────────┘
```

---

## Request Lifecycle

1. **Browser** requests a page (e.g. `/blog/my-post`).
2. **Vercel Edge** terminates TLS, applies CDN caching, routes to the Next.js
   server.
3. **Next.js server** matches the route to a page component in `src/app/`.
4. The **page component** (always a Server Component) fetches data:
   - Static content from `src/content/` — synchronous, no I/O.
   - Blog posts from Hashnode RSS — async fetch with ISR (`revalidate = 3600`).
5. The **root layout** renders Nav + Footer + JSON-LD around the page content.
6. **Client components** hydrate in the browser:
   - `Nav` — scroll detection, mobile menu toggle.
   - `RevealSection` — scroll-triggered fade-in animations.
   - `ContactForm` — form state management, client-side validation, API call.
   - Blog components — search, tag filter, reading progress, table of contents.
7. **API route** `POST /api/contact` handles form submissions:
   - Rate limit check (Upstash Redis or in-memory).
   - Honeypot check (silently accepts bot submissions).
   - Server-side validation (shared code with client).
   - Email delivery via Resend.
   - Structured logging + optional alerting.

---

## Data Flow

### Content Data

All static content follows the same pattern:

```
src/content/*.ts    →    page.tsx imports    →    Server Component renders
```

Content files export typed arrays/objects. No database, no API, no build-time
generation beyond what Next.js already does. The content files include:

- `projects/index.ts` — case studies (individual files in `projects/`)
- `blog-placeholder.ts` — fallback posts when Hashnode is unconfigured
- `community.ts` — leadership roles, speaking engagements
- `timeline.ts` — career timeline
- `education.ts` — education entries
- `certifications.ts` — certifications
- `impact-stats.ts` — aggregated community impact numbers

### Blog Data

Blog posts are fetched from Hashnode's public RSS feed at request time:

```
Hashnode RSS XML  →  fast-xml-parser  →  BlogPost[]  →  page renders
```

The feed URL is constructed from `HASHNODE_PUBLICATION_HOST`. When that variable
is unset, the site falls back to `placeholderBlogPosts` from
`src/content/blog-placeholder.ts`.

All blog routes use `revalidate = 3600` (ISR), so new posts appear within an
hour of publication without a redeploy.

### Contact Form Flow

```
Client                          Server                          External
──────                          ──────                          ────────
User fills form
  │
  ▼
Client validation (shared code) ──▶ POST /api/contact
                                      │
                                      ├── Rate limit check ──────▶ Upstash Redis
                                      ├── Honeypot check
                                      ├── Server validation (shared code)
                                      ├── Send email ────────────────▶ Resend API
                                      ├── Structured log ────────────▶ Vercel Logs
                                      ├── Webhook alert (opt-in) ────▶ Discord/Slack
                                      └── Email alert (opt-in) ──────▶ Resend
                                      │
                                      ◀── JSON response ───────────────▶ Client
```

---

## Component Architecture

Components are organized by role in four directories:

```
src/components/
  layout/       # Shell components: Nav, Footer, MobileMenu
  sections/     # Page sections: Hero, ProjectGrid, Timeline, ContactForm, etc.
  ui/           # Primitive UI: Button, Badge, Card, Container, SectionHeading
  seo/          # SEO utilities: JsonLd
  blog/         # Blog-specific: BlogCard, BlogGrid, ArticleContent, etc.
  community/    # Community-specific: LeadershipCard, SpeakingCard, etc.
```

### Client Component Boundary

The following components are wrapped in `"use client"`:

| Component         | Reason                                               |
| ----------------- | ---------------------------------------------------- |
| `Nav`             | Scroll state, pathname detection, mobile menu toggle |
| `MobileMenu`      | Interactive overlay                                  |
| `RevealSection`   | Scroll-triggered animation via Framer Motion         |
| `StackHighlights` | Hover state tracking for tech icons                  |
| `ProjectCard`     | Scroll-triggered entrance animation                  |
| `ContactForm`     | Form state, validation, API submission               |
| `BlogGridClient`  | Client-side grid layout (shuffled order)             |
| `ReadingProgress` | Scroll-based progress bar                            |
| `TableOfContents` | Intersection Observer for heading tracking           |
| `SearchBox`       | URL search param updates                             |
| `TagFilter`       | URL search param updates                             |
| `ShareButtons`    | Clipboard API, share intent                          |
| `BlogCard`        | Entrance animation                                   |
| `AnimatedStat`    | Count-up number animation                            |
| `SpeakingCard`    | Entrance animation                                   |
| `LeadershipCard`  | Entrance animation                                   |

### Server Components (no client JS shipped)

- All page components (`page.tsx`)
- `CaseStudyLayout`
- `ProjectGrid` (delegates animation to `ProjectCard`)
- `CredibilityStrip`
- `Hero`
- `Timeline`, `TimelineItem`, `TimelineNode`
- `Footer`
- `Container`
- `Button`
- `Badge`
- `Card`
- `SectionHeading`
- `ArticleContent`
- `Pagination`
- `Skeletons`
- `FeaturedPost`
- `PostNavigation`

---

## Key Architectural Decisions

| Decision                            | Rationale                                                                                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hashnode RSS over GraphQL**       | Hashnode retired free GraphQL access (May 2026). The public RSS feed is free, exposes all needed data, and requires no token.                                                             |
| **ISR over SSR**                    | Blog content changes infrequently. ISR with `revalidate = 3600` means near-instant loads with at-most-1-hour staleness.                                                                   |
| **In-memory rate limiter fallback** | Keeps the contact form functional when Upstash is not configured, at the cost of per-instance state (not shared across Vercel instances).                                                 |
| **Shared validation code**          | `src/lib/validation.ts` is a pure-function module used by both `ContactForm.tsx` (client) and `api/contact/route.ts` (server). No platform-specific imports — works in both environments. |
| **BoundedMap for caches**           | Both the rate limiter ephemeral cache and the in-memory fallback use `BoundedMap` (max 10k entries) to prevent attacker-controlled key growth.                                            |
| **next/font over hosted fonts**     | Eliminates external network requests for font files. Fonts are inlined into the CSS at build time.                                                                                        |
| **Dynamic import for ContactForm**  | `dynamic(() => import(...))` splits the form into a separate chunk so the contact page shell renders immediately.                                                                         |

---

## Technology Decisions

| Area              | Choice                | Why                                                |
| ----------------- | --------------------- | -------------------------------------------------- |
| Framework         | Next.js 16            | SSR, ISR, App Router, image optimization           |
| Language          | TypeScript 5 (strict) | Type safety across the entire codebase             |
| Styling           | Tailwind CSS v4       | Zero-runtime CSS, CSS-based `@theme` config        |
| Animation         | Framer Motion 12      | Declarative animations with reduced-motion support |
| Icons             | Lucide React          | Lightweight, tree-shakeable, consistent style      |
| Fonts             | `next/font/google`    | Self-hosted, no external network requests          |
| Blog backend      | Hashnode RSS          | Free, no token required, ISR-friendly              |
| Email             | Resend API            | Simple REST API, idempotency support               |
| Rate limiting     | Upstash Redis         | Serverless Redis with sliding window               |
| XML parsing       | fast-xml-parser       | Lightweight, handles RSS CDATA correctly           |
| Code highlighting | Prism.js              | Client-side, lightweight, no build step needed     |
