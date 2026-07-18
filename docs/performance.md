# Performance

## Overview

The project is optimized for fast page loads, minimal client JavaScript, and
efficient caching. Performance strategies are layered rather than relying on
any single technique.

---

## Image Optimization

All images use `next/image` for automatic optimization:

- **Remote patterns** configured for ImageKit, Hashnode CDN, and Unsplash
  (see `next.config.ts` `images.remotePatterns`).
- **ImageKit transformations:** All project and blog images use
  `tr=w-{width},q-80,fo-auto` via the URL builder in
  `src/lib/project-images.ts`:
  - `q-80` — balanced quality/file-size ratio.
  - `fo-auto` — automatic focus detection for crops.
- **LCP images** (`Hero` headshot, blog cover images) use `priority` prop
  to skip lazy loading.
- **Responsive sizes** specified via `sizes` attribute on every image:
  - Hero/headshot: `(min-width: 768px) 33vw, 80vw`.
  - Blog covers: `(min-width: 768px) 768px, 100vw`.
  - Case study screenshots: `(min-width: 640px) 50vw, 100vw`.

---

## Font Optimization

```typescript
// src/styles/fonts.ts
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // fallback font shown immediately, swap in loaded font
});
```

- All four font families are loaded via `next/font/google`:
  - **Inter** — body text.
  - **Space Grotesk** — headings.
  - **JetBrains Mono** — code/technical text.
  - **Caveat** — signature accents.
- `display: "swap"` on all fonts prevents FOIT (Flash of Invisible Text).
- Fonts are self-hosted (downloaded at build time, served from `/_next/static/`
  in production).
- CSS variables (`--font-*`) connect the font files to Tailwind's `font-*`
  utilities.

---

## Server Components

Pages are Server Components by default. Client JavaScript is shipped only for
genuinely interactive leaf components:

| Client component | JS shipped (~gzipped)                    | Purpose                          |
| ---------------- | ---------------------------------------- | -------------------------------- |
| `RevealSection`  | ~0.5 KB + Framer Motion code-split entry | Scroll-triggered animations      |
| `Nav`            | ~1 KB                                    | Scroll detection, mobile menu    |
| `ContactForm`    | ~3 KB                                    | Form state, validation, API call |
| `BlogGridClient` | ~0.5 KB                                  | Client grid shuffle              |

This means most page weight is HTML + CSS + images, not JavaScript.

---

## Incremental Static Regeneration (ISR)

All blog routes use ISR to serve cached content between revalidations:

| Route           | `revalidate`  | Effect                            |
| --------------- | ------------- | --------------------------------- |
| `/blog`         | 3600 (1 hour) | New posts appear within an hour   |
| `/blog/[slug]`  | 3600          | Article pages refresh hourly      |
| `/s/[code]`     | 3600          | Short-link redirects stay current |
| `/blog/rss.xml` | 3600          | RSS feed updates hourly           |

ISR means:

- First visit after deploy or cache eviction: server-rendered.
- Subsequent visits within the 1-hour window: served from cache instantly.
- After 1 hour: stale cache served while revalidation completes in background.

Hashnode RSS fetches use Next.js `next.revalidate` in `fetch()`:

```typescript
fetch(url, {
  next: { revalidate: 3600, tags: ["hashnode-posts"] },
});
```

The `tags` array enables on-demand revalidation if needed.

---

## Reduced Client JS

**No animation on LCP elements** — Hero, cover images, and featured post
cards are never wrapped in `RevealSection` or animated. This ensures:

- LCP is the fastest possible paint (no opacity/transform animations).
- No layout shift from animation-induced repaints.

**No page-transition animations** — omitted deliberately to avoid:

- Double-render flicker from layout animations.
- Increased INP (Interaction to Next Paint) from animation handlers.
- Additional client JS for a marginal UX gain on a content site.

**Code-split contact form** — `ContactForm` is dynamically imported:

```typescript
const ContactForm = dynamic(
  () => import("@/components/sections/ContactForm").then((mod) => mod.ContactForm),
  { loading: () => <output className="h-96 animate-pulse rounded-md bg-gray-100" /> },
);
```

This splits the form into a separate chunk and shows a skeleton placeholder
while it loads.

---

## CI Build Caching

The GitHub Actions CI pipeline caches Next.js build output:

```yaml
- uses: actions/cache@v6
  with:
    path: .next/cache
    key: nextjs-build-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts,css,json}') }}
```

The cache key includes the lockfile hash (for dependency changes) and source
file hash (for code changes), so builds only recompile what changed.

---

## Bundle Analysis

```bash
npm run analyze
```

Generates three HTML reports in `.next/analyze/`:

- **Client** — browser bundle sizes.
- **Edge** — edge runtime bundle sizes.
- **Server** — server bundle sizes.

Each report shows individual chunk sizes and tree-shaking opportunities. Use
this before adding significant new dependencies.

---

## Accessibility Performance (`prefers-reduced-motion`)

All animations respect the user's motion preference:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

Framer Motion components use `useReducedMotion()` to conditionally disable
animations:

```typescript
const shouldReduceMotion = useReducedMotion();
// ...initial={!shouldReduceMotion ? { opacity: 0 } : undefined}
```

---

## ImageKit CDN

Project and blog images are served through ImageKit CDN with on-the-fly
transformations. Benefits:

- Automatic WebP/AVIF conversion when supported.
- `q-80` compression for optimal quality/size balance.
- `fo-auto` smart cropping for thumbnails.
- Global CDN edge caching.
