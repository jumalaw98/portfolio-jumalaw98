# jumalaw98 — Portfolio

Lawrence Juma's developer portfolio. A fully functional, production-ready
personal site built with Next.js 16 (App Router), React 19, and TypeScript —
featuring case studies, a Hashnode-powered blog with RSS, a contact form with
rate limiting and server-side validation, and comprehensive SEO.

---

## Quick Start

```bash
git clone https://github.com/jumalaw98/portfolio-jumalaw98.git
cd portfolio-jumalaw98
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Documentation

All project documentation is in the [`docs/`](docs/) directory:

| Document                                                 | Description                                           |
| -------------------------------------------------------- | ----------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)           | Application architecture, data flow, design decisions |
| [`docs/project-structure.md`](docs/project-structure.md) | Full directory and file listing                       |
| [`docs/getting-started.md`](docs/getting-started.md)     | Setup guide, prerequisites, environment variables     |
| [`docs/development.md`](docs/development.md)             | Development workflow and available scripts            |
| [`docs/coding-standards.md`](docs/coding-standards.md)   | TypeScript, ESLint, Prettier, naming conventions      |
| [`docs/components.md`](docs/components.md)               | Component library, props, and usage                   |
| [`docs/routing.md`](docs/routing.md)                     | App Router pages, layouts, dynamic routes             |
| [`docs/api.md`](docs/api.md)                             | API route documentation (contact form, RSS feed)      |
| [`docs/security.md`](docs/security.md)                   | Security headers, CSP, input validation, monitoring   |
| [`docs/performance.md`](docs/performance.md)             | Image/font optimization, ISR, bundle analysis         |
| [`docs/seo.md`](docs/seo.md)                             | Metadata, JSON-LD, sitemap, robots.txt                |
| [`docs/deployment.md`](docs/deployment.md)               | Deployment configuration and pre-deployment checklist |
| [`docs/ci-cd.md`](docs/ci-cd.md)                         | CI pipeline, CodeQL analysis, Dependabot              |
| [`docs/troubleshooting.md`](docs/troubleshooting.md)     | Common issues and solutions                           |
| [`docs/contributing.md`](docs/contributing.md)           | Contributing guidelines                               |

---

## Key Features

| Feature                  | Details                                                                                                                                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Case studies**         | Five in-depth project write-ups with full problem/constraint/decision narratives                                                                                                                                                                               |
| **Blog**                 | Server-side fetched from Hashnode's public RSS feed with ISR (1-hour revalidation). Tag filtering, client-side search, sticky table of contents, reading progress bar, Prism syntax highlighting, share buttons, prev/next navigation, related posts, RSS feed |
| **Blog short links**     | Deterministic short codes (`/s/<code>`) resolve to full blog post URLs — no storage required                                                                                                                                                                   |
| **Contact form**         | Server-side validation, spam-pattern detection, honeypot field, rate limiting (Upstash Redis with in-memory fallback), idempotent submissions, structured monitoring                                                                                           |
| **Community & Speaking** | Leadership cards with logo/fallback, speaking engagement cards, animated impact stats dashboard                                                                                                                                                                |
| **SEO**                  | Per-page OpenGraph/Twitter metadata, JSON-LD (Person, BreadcrumbList, Article), auto-generated sitemap, robots.txt, canonical URLs, generated OG image                                                                                                         |
| **Animations**           | Scroll-triggered reveals, staggered card entrance effects, hover elevation — Framer Motion with full `prefers-reduced-motion` support                                                                                                                          |
| **Security headers**     | Content Security Policy, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy                                                                                                                        |

---

## Technology Stack

| Layer              | Technology                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | [Next.js 16](https://nextjs.org/) (App Router, Turbopack)                                                                                 |
| UI library         | [React 19](https://react.dev/)                                                                                                            |
| Language           | [TypeScript 5](https://www.typescriptlang.org/) (strict mode)                                                                             |
| Styling            | [Tailwind CSS v4](https://tailwindcss.com/) (CSS-based `@theme` config)                                                                   |
| Animation          | [Framer Motion 12](https://www.framer.com/motion/)                                                                                        |
| Icons              | [Lucide React](https://lucide.dev/)                                                                                                       |
| Fonts              | [next/font/google](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) — Inter, Space Grotesk, JetBrains Mono, Caveat |
| Blog backend       | [Hashnode](https://hashnode.com/) public RSS feed (fallback to local placeholders)                                                        |
| Email              | [Resend](https://resend.com/) API                                                                                                         |
| Rate limiting      | [Upstash Redis](https://upstash.com/) (sliding window, with in-memory fallback)                                                           |
| XML parsing        | [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)                                                                 |
| Code highlighting  | [Prism.js](https://prismjs.com/) (client-side)                                                                                            |
| Bundle analysis    | [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)                                                              |
| Linting            | [ESLint 9](https://eslint.org/) (eslint-config-next, flat config)                                                                         |
| Formatting         | [Prettier 3](https://prettier.io/)                                                                                                        |
| CI/CD              | [GitHub Actions](https://github.com/features/actions) (3-tier pipeline + CodeQL)                                                          |
| Dependency updates | [Dependabot](https://github.com/dependabot)                                                                                               |
| Deployment         | [Vercel](https://vercel.com/)                                                                                                             |

---

## Project Structure (Overview)

```
src/
  app/                    # Next.js App Router pages and API routes
  components/             # React components (layout, ui, sections, blog, seo, community)
  content/                # Static content as TypeScript data files
  lib/                    # Shared utilities and business logic
  styles/                 # Font configuration
  types/                  # TypeScript type definitions
```

See [`docs/project-structure.md`](docs/project-structure.md) for the full
directory listing.

---

## Available Scripts

| Script         | Command                                       | Description                          |
| -------------- | --------------------------------------------- | ------------------------------------ |
| `dev`          | `next dev`                                    | Start development server (Turbopack) |
| `build`        | `npm run quality && next build`               | Run quality checks, then build       |
| `start`        | `next start`                                  | Start production server              |
| `typecheck`    | `tsc --noEmit`                                | TypeScript type checking             |
| `lint`         | `eslint .`                                    | Run ESLint                           |
| `format`       | `prettier --write .`                          | Format all files                     |
| `format:check` | `prettier --check .`                          | Check formatting (CI)                |
| `quality`      | `typecheck + format:check + lint`             | All quality checks                   |
| `analyze`      | `cross-env ANALYZE=true next build --webpack` | Bundle analysis                      |

See [`docs/development.md`](docs/development.md) for details.

---

## Environment Variables

All variables are optional for local development. See
[`docs/getting-started.md`](docs/getting-started.md) for the full reference.

**Required for production:** `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`,
`CONTACT_RECEIVER_EMAIL`.

**Optional:** `HASHNODE_PUBLICATION_HOST`, `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, `MONITOR_EMAIL_TO`, `MONITOR_EMAIL_FROM`,
`MONITOR_WEBHOOK_URL`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.

---

## Pre-Deployment Checklist

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production domain.
- [ ] Set `RESEND_API_KEY` and `CONTACT_RECEIVER_EMAIL`.
- [ ] Set `HASHNODE_PUBLICATION_HOST` to connect the blog.
- [ ] Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- [ ] Optionally set monitoring variables for alerts.

See [`docs/deployment.md`](docs/deployment.md) for the full checklist.

---

## License

All rights reserved. This is a personal portfolio site and is not open for
reuse without explicit permission.
