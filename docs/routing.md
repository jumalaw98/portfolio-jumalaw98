# Routing

## App Router Structure

The project uses Next.js 16 App Router with file-system based routing. All
routes are defined under `src/app/`.

```
src/app/
├── page.tsx                    # / — Home page
├── not-found.tsx               # 404 — Custom not-found page
├── layout.tsx                  # Root layout (all routes)
├── robots.ts                   # /robots.txt
├── sitemap.ts                  # /sitemap.xml
├── opengraph-image.tsx          # /opengraph-image.png (OG fallback)
├── globals.css                 # Global styles + Tailwind @theme
│
├── about/
│   └── page.tsx                # /about — About + Resume
│
├── contact/
│   └── page.tsx                # /contact — Contact page (shell + form)
│
├── projects/
│   ├── page.tsx                # /projects — Project listing
│   └── [slug]/
│       └── page.tsx            # /projects/[slug] — Case study
│
├── blog/
│   ├── page.tsx                # /blog — Blog listing
│   ├── [slug]/
│   │   └── page.tsx            # /blog/[slug] — Blog post
│   └── rss.xml/
│       └── route.ts            # /blog/rss.xml — RSS feed
│
├── community/
│   └── page.tsx                # /community — Community & Speaking
│
├── s/
│   └── [code]/
│       └── page.tsx            # /s/[code] — Blog short-link redirect
│
└── api/
    └── contact/
        └── route.ts            # POST /api/contact — Contact form endpoint
```

---

## Route Details

### `/` — Home Page (`page.tsx`)

Sections:

- `Hero` — headline, subline, headshot, CTAs.
- `StackHighlights` — interactive tech icon bar.
- Featured projects (filtered from `mvpProjects` where `featured: true`).
- `CredibilityStrip` — key metrics.
- "Get In Touch" CTA.

No fetch/data loading — all content is static imports.

### `/about` — About + Resume (`about/page.tsx`)

Sections (10 total):

1. Introduction with headshot + `JumpNav`.
2. Professional Summary.
3. Career Journey (`Timeline`).
4. Skills & Expertise (6 category groups).
5. Resume (download PDF + request tailored version).
6. Education (3 entries).
7. Certifications (4 lead + "16 more" link to Credly).
8. Community Leadership.
9. Personal Note.
10. Call to Action.

This page is a single Server Component with 8 `RevealSection` wrappers.

**Redirect:** The legacy `/resume` path is a permanent redirect (308) to
`/about#resume`, configured in `next.config.ts`.

### `/projects` — Project Listing (`projects/page.tsx`)

Renders all `mvpProjects` (filtered to `status === "live"`) in a responsive
grid. A visually-hidden `h2` ("All Case Studies") maintains heading hierarchy.

### `/projects/[slug]` — Case Study (`projects/[slug]/page.tsx`)

- Generates static params from all `mvpProjects` slugs.
- Returns `notFound()` if the project status is not `"live"`.
- Displays JSON-LD BreadcrumbList (Projects → project title).
- Renders `CaseStudyLayout` with the next project for navigation.

### `/blog` — Blog Listing (`blog/page.tsx`)

- ISR with `revalidate = 3600` (1 hour).
- Fetches posts from Hashnode RSS. Falls back to placeholders if unconfigured.
- **Search params:** `tag`, `q` (search), `page` (pagination).
- Top 5 most-used tags shown in `TagFilter` (active tag always visible).
- Client-side search via URL `q` param (server-filtered).
- 18 posts per page (`PAGE_SIZE`).
- Featured post hero on unfiltered first page only.
- Random grid order on first page (deterministic seed per request).
- Page sizes are Math.ceil-based: an exact 18 items = 1 page.

**SEO notes:**

- RSS feed alternate link in metadata.
- Visually-hidden h2 ("Filtered Articles" / "All Articles") maintains outline.
- Placeholder/fetch-failure banners shown inline.

### `/blog/[slug]` — Blog Post (`blog/[slug]/page.tsx`)

- ISR with `revalidate = 3600`.
- Fetches full post details from Hashnode RSS (up to `RSS_FEED_MAX_SIZE` = 200).
- On transient fetch failure: throws error so ISR retains last cached page.
- On genuine missing post: returns `notFound()` (404).
- Displays: breadcrumb, tags, title, subtitle, author info, cover image,
  article HTML, share buttons, prev/next navigation, related posts (up to 3).
- Sticky `TableOfContents` sidebar (desktop only, hidden via `md:hidden`).
- `ReadingProgress` bar at viewport top.
- JSON-LD: Article schema + BreadcrumbList.

### `/blog/rss.xml` — RSS Feed (`blog/rss.xml/route.ts`)

- ISR with `revalidate = 3600`.
- Generates valid RSS 2.0 XML from blog posts.
- Falls back to placeholders when Hashnode is not configured.
- Returns empty feed (not an error) on fetch failure when configured.

### `/community` — Community & Speaking (`community/page.tsx`)

Sections:

1. Intro header.
2. Roles & Leadership (grid of `LeadershipCard` components).
3. Impact Numbers (animated stats from `impact-stats.ts`).
4. Speaking Engagements (grid of `SpeakingCard` components).
5. Live Sessions & Content (SYTTechTalk, technical writing session).
6. Call to Action.

### `/s/[code]` — Blog Short Link (`s/[code]/page.tsx`)

- Generates deterministic short codes from slugs using DJB2 hash (see
  `src/lib/shortId.ts`).
- Looks up the post by `shortId` and redirects (307) to `/blog/[slug]`.
- No storage required — same slug always produces the same code.
- ISR with `revalidate = 3600`.
- On fetch failure: returns `notFound()` (preserves ISR cache).
- Supports both Hashnode and placeholder posts.

### `/api/contact` — Contact Form API (`api/contact/route.ts`)

POST endpoint. See `docs/api.md` for full documentation.

---

## Root Layout (`layout.tsx`)

The root layout wraps all routes:

```typescript
export const metadata = defaultMetadata;  // from lib/seo.ts

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <JsonLd data={personJsonLd()} />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- `suppressHydrationWarning` on `<html>` and `<body>` prevents false-positive
  mismatches from browser extensions (Dark Reader, Grammarly).
- Font variables are set as class names on `<html>` from `styles/fonts.ts`.
- Person JSON-LD schema is rendered once in the root layout (covers Home and
  About).
- The `<main>` element uses `flex-1` to push the footer to the bottom on
  short pages.

## 404 Page (`not-found.tsx`)

Custom "Page Not Found" page with:

- `robots: { index: false, follow: false }`.
- 404 code in brand-blue mono font.
- "Page not found" heading with explanation.
- "Back Home" button.

## Redirects

Configured in `next.config.ts`:

| Source    | Destination     | Type            |
| --------- | --------------- | --------------- |
| `/resume` | `/about#resume` | Permanent (308) |

---

## Metadata

See `docs/seo.md` for metadata strategy.

---

## Dynamic Routes Summary

| Param    | Route              | Source                             |
| -------- | ------------------ | ---------------------------------- |
| `[slug]` | `/projects/[slug]` | `mvpProjects` (static generation)  |
| `[slug]` | `/blog/[slug]`     | Hashnode RSS (ISR) or placeholders |
| `[code]` | `/s/[code]`        | Hashnode RSS (ISR) or placeholders |

## Search Params Summary

| Param  | Route   | Purpose          |
| ------ | ------- | ---------------- |
| `tag`  | `/blog` | Tag filter       |
| `q`    | `/blog` | Full-text search |
| `page` | `/blog` | Pagination       |
