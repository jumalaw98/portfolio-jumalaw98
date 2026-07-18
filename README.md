# jumalaw98 — Portfolio

Lawrence Juma's developer portfolio. Built with Next.js (App Router) + TypeScript +
Tailwind CSS, per `project-architecture.md`, `portfolio-master-blueprint.md`,
`portfolio-sitemap.md`, `branding-guide.md`, and `lawrence-juma-brand-profile.md`.

## Status

MVP pages (Home, Projects, Case Studies, About, Resume, Contact) **and** the V2
Community & Speaking and Blog pages are built and wired to real content from
`portfolio-content.md`. Remaining work is asset drops and a handful of
confirmed-pending content fields (see below).

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in values, see below
npm run dev
```

Open http://localhost:3000.

> **Note:** `next/font/google` needs to reach `fonts.googleapis.com` at build
> time. If you're building in a sandboxed/offline environment, that fetch will
> fail — it works normally in local dev, CI, and on Vercel where outbound
> internet access is unrestricted.

## Environment variables

See `.env.local.example`. None are required to run the site locally — the
contact form and blog integration degrade gracefully without them (see below).

| Variable                       | Used for                                                                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`         | Canonical URLs, sitemap, OG metadata. Defaults to a placeholder until the domain is chosen.                                                                                                             |
| `HASHNODE_PUBLICATION_HOST`    | V2 blog integration (`lib/hashnode.ts`). Not yet wired into a page.                                                                                                                                     |
| `RESEND_API_KEY`               | Contact form email delivery. Without it, submissions are silently accepted in development (useful for local testing) but return a 503 error in production — a key is expected in deployed environments. |
| `CONTACT_RECEIVER_EMAIL`       | Where contact form emails go. Falls back to the address in `lib/constants.ts`.                                                                                                                          |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Analytics, V2.                                                                                                                                                                                          |

## What's stubbed vs. real

**Real content** (from `portfolio-content.md`): Home headline/sub-line, all three
MVP case studies (Africa DevOps Summit, Nairobi DevOps Community, Pretalx/Azure),
About page narrative sections, the full "Path So Far" timeline, certifications,
Resume skills summary, Contact details and socials, Community & Speaking roles/
impact numbers/speaking engagements/live sessions.

**Placeholder imagery (Unsplash), swap before launch:**
All images across the site — the hero/About headshot, the three project case
study screenshots, and the Blog page's fallback cover images — currently point
to Unsplash URLs defined in `src/lib/placeholder-images.ts`. Swap each entry in
that one file for a real asset path once photos/screenshots are ready; no
component changes needed. `next.config.ts` allowlists `images.unsplash.com` for
this reason — remove that remote pattern once everything is local.

**Blog page behavior:** `/blog` and `/blog/[slug]` are a full reading experience —
not a link-out. Content is fetched server-side straight from Hashnode's GraphQL
API (`src/lib/hashnode/`) with ISR (1-hour revalidation), and includes tag
filtering, in-app search, a sticky table of contents, a reading-progress bar,
client-side Prism syntax highlighting, share buttons, prev/next navigation,
related posts, full SEO metadata (OG/Twitter/canonical/JSON-LD Article +
Breadcrumb schema), and an RSS feed at `/blog/rss.xml`. Until
`HASHNODE_PUBLICATION_HOST` is set, both pages automatically fall back to three
clearly-labeled placeholder posts (`src/content/blog-placeholder.ts`, full HTML
content included) with an on-page notice — so the whole reading experience can
be exercised end-to-end before Hashnode is connected. Set the env var and the
placeholders disappear on their own.

### Blog architecture

```
src/lib/hashnode/
  client.ts    → typed fetch wrapper for gql.hashnode.com (no auth needed — public data only)
  queries.ts   → GraphQL query strings (posts list, single post by slug)
  types.ts     → raw API response shapes
  posts.ts     → app-facing functions: getAllPosts, getPostBySlug, getAdjacentPosts,
                 getRelatedPosts, getAllTagsFromPosts, isHashnodeConfigured
  index.ts     → barrel export

src/components/blog/
  BlogCard.tsx, BlogGrid.tsx, FeaturedPost.tsx   → listing UI
  TagFilter.tsx, SearchBox.tsx                    → client, drive ?tag=/?q= URL params
  ArticleContent.tsx                              → renders content.html + Prism highlighting
  TableOfContents.tsx                             → parses h2/h3 from rendered content, IntersectionObserver
  ReadingProgress.tsx                             → fixed scroll-based progress bar
  ShareButtons.tsx, PostNavigation.tsx, RelatedPosts.tsx
  Skeletons.tsx                                   → loading states
```

**Known limitation — search:** Hashnode's public API doesn't expose a stable
full-text search endpoint, so `SearchBox` filters over the already-fetched post
set client-side (title/subtitle/brief substring match). This is fine at
personal-blog volume. If the post count grows large enough that fetching all
posts per request becomes wasteful, the natural upgrade path is indexing posts
into Algolia or a small Orama instance on publish (e.g., via a Hashnode
webhook), and swapping `SearchBox`'s query logic for a real search call without
touching the rest of the page.

**Future scalability notes:**

- Pagination isn't wired up yet — `getAllPosts()` fetches up to 50 posts in one
  request, which comfortably covers a personal blog's near-term volume. Past
  that, switch to Hashnode's cursor-based pagination (`pageInfo.endCursor`,
  already present in `types.ts`) and add "load more" or numbered pages.
- Table of Contents currently only handles `h2`/`h3`. If deeper nesting becomes
  common, extend the selector in `TableOfContents.tsx`.
- Comments aren't implemented. Hashnode's API doesn't expose read/write comment
  threads for external sites in a straightforward way — an embedded solution
  like giscus or utterances would be the simplest addition if wanted.

**Placeholders — drop in when ready, no code changes needed:**

- `src/lib/placeholder-images.ts` — swap each Unsplash URL for a real local asset path (headshot, project screenshots)
- `public/resume/lawrence-juma-resume.pdf` — Resume page download button
- `public/logo/logo-full.svg`, `logo-mark.svg` — favicon source + nav mark
- `public/images/og/*` — per-page OpenGraph images

**Still-open content items** (tracked in `portfolio-content.md`'s own open-items
list, carried into code as `TODO`/`[TBD]` markers — grep for `TBD` or `TODO`):

1. SheCodeAfrica Nairobi start year (`src/content/timeline.ts`, `src/content/community.ts`)
2. DevFest Kisumu vs. DevFest Western Kenya naming (`src/content/community.ts`)
3. "M-PESA Integration" session view count/link (`src/content/community.ts`)
4. Testimonials (none collected yet; still not built — see below)

**Not yet built (V2/Long-term per the sitemap):** Testimonials section, dark
mode, Plausible/PostHog analytics, `/services`, `/media-kit`, `/uses`.

## About + Resume merge

The standalone `/resume` page has been merged into `/about` as a section
(`id="resume"`, `scroll-mt-24` so it clears the sticky nav). `/resume` now
308-redirects to `/about#resume` (`next.config.ts`), so old bookmarks/links
still work.

**Content review — what was duplicated and how it was resolved:**

- **Skills** appeared twice: as prose in About's old "What I Do Today" and as
  a tag list in Resume's "Quick Skills Summary." Now there's one canonical
  **Skills & Expertise** section (the tag list); the old prose was tightened
  into a **Professional Summary** section instead of repeating the same facts
  in paragraph form.
- **Contact CTAs** appeared at the bottom of both pages. Now there's a single
  consolidated CTA at the end of the merged page (Contact + View Projects);
  the Resume section itself keeps its own distinct "Download PDF" /
  "Request a Tailored Version" actions, since those are a different action
  from "get in touch," not a duplicate of it.

**New unified structure** (10 sections, per the requested IA — adapted to
what's actually documented in this project):
Introduction → Professional Summary → Career Journey (Timeline) →
Skills & Expertise → **Resume** (`#resume`) → Education → Certifications →
Community Leadership → Personal Note → Call to Action.

Two deliberate deviations from a literal read of the requested order:

- **Community Leadership** here is the existing "why community work matters
  to my engineering" bridge paragraph plus a link out to `/community` — not a
  re-embedding of the Leadership/Impact cards that already live on that page.
  Duplicating those components here would undercut the dedicated Community
  page rather than complement it.
- **Awards & Achievements** was left out entirely. Nothing in this project's
  content docs documents a specific award, and inventing one to fill the slot
  would break the honesty standard the rest of the site holds to. Add a
  section for it whenever there's something real to put there.

An in-page jump nav (`src/components/sections/JumpNav.tsx`) sits under the
intro for scannability now that the page is longer — plain anchor links, no
scroll-spy/active-section tracking, to keep this page's client JS minimal.
Each major section fades in once on scroll via `RevealSection.tsx`, a small
isolated client wrapper so the page itself stays a Server Component.

## Navigation active states

`Nav.tsx` and `MobileMenu.tsx` now highlight the current section — blue text
plus an animated underline on desktop, a filled pill on mobile — using
`isNavLinkActive()` in `lib/utils.ts`, which matches nested routes too (e.g.
`/projects/[slug]` still highlights "Projects"). Resume was removed from the
top-level nav entirely (it's a same-page anchor now, not a separate route);
it's still reachable via the Footer's "Resume" link and the About page's own
CTAs.

## Roles & Leadership and Impact Numbers redesign

`/community`'s **Roles & Leadership** cards (`src/components/community/LeadershipCard.tsx`)
now show a logo (or a colored initials fallback when no real logo file exists
yet), description, optional responsibility highlights, 3–5 focus-area tags,
duration, and outbound links (website, GitHub, LinkedIn, Meetup, Discord — all
`target="_blank" rel="noopener noreferrer"`, all conditionally rendered).
Cards fade in on scroll and lift slightly on hover via Framer Motion, fully
disabled under `prefers-reduced-motion`.

**Content status:** InfoSec365, Nairobi DevOps Community, SpaceYaTech, and
SheCodeAfrica Nairobi now have confirmed websites and official taglines
(supplied directly). GDSC Kisumu Poly and WesternCyberHub still need their
links confirmed (`// TODO` in `src/content/community.ts`). **WTD Kenya** was
added as a new roster entry from a confirmed website/description, but its
exact role and duration weren't specified — both are flagged `TBD` pending
confirmation with Lawrence. No logo image files exist yet, so every card
currently shows its initials-in-a-colored-circle fallback; drop a real
`logoUrl` into any entry once available and the fallback disappears
automatically.

**Impact Numbers** (`src/components/community/AnimatedStat.tsx` +
`src/content/impact-stats.ts`) is now a count-up dashboard aggregating across
_all_ documented activity rather than one organization: community members
reached, speaking engagements, communities led, years of community
leadership, production platforms shipped, and countries reached. Three of
these (speaking engagements, communities led, years of leadership) are
computed directly from the site's own content arrays, so they can't drift out
of sync as the roster or talk list grows. One (countries reached) is marked
`approx: true` and rendered with a small "(approx.)" label — an honest,
conservative estimate rather than an invented precise figure. Two commonly
expected metrics — mentoring sessions and volunteers coordinated — were left
out entirely rather than filled with a plausible-sounding but unsourced
number; add them to `impactStats` once real counts exist and the grid/count-up
picks them up with no other changes needed. Each stat counts up from zero
once, the first time it scrolls into view, and shows its final value
immediately (no animation) under reduced-motion preferences.

## Speaking Engagements cards

`/community`'s Speaking Engagements section (`src/components/community/`)
shows richer cards: description, event + location, Month/Year date, three
topic tags, a conditionally-rendered resources row (slides/recording/event
page), and a placeholder banner image. Framer Motion drives a subtle
elevation/shadow effect on hover, fully disabled via `useReducedMotion()` for
anyone with reduced-motion preferences set.

**Content status:** talk titles, event names, and dates are confirmed
(`portfolio-content.md` Section 6d). Descriptions, tags, and locations are
**drafted placeholders** — reasonable summaries derived from the confirmed
titles, marked `// TODO: review wording` / `// TODO: confirm venue` in
`src/content/community.ts` for Lawrence to tighten or correct. No resource
links (slides/video/event page) are fabricated — `resources` stays `undefined`
until real links exist, so the CTA row only appears once there's something
real to link to. Banner images are Unsplash placeholders, same convention as
the rest of the site's placeholder imagery.

## Site-wide animation & SEO pass

A full-app review pass covering scroll animations, micro-interactions, and
technical SEO across every page.

### Animation strategy

- **`RevealSection`** (`src/components/ui/RevealSection.tsx`) is the one
  reusable fade/slide-up-on-scroll wrapper used everywhere: Home (below the
  hero), Projects listing, case study body sections, Contact, Blog listing
  and post pages, and every Community page section. It's a small isolated
  client component — the pages wrapping it stay Server Components, so only
  this leaf ships animation JS. Respects `prefers-reduced-motion` via Framer
  Motion's `useReducedMotion()` (skips the animation entirely, not just
  slows it down).
- **Cards** (`ProjectCard`, `BlogCard`, and the pre-existing `LeadershipCard`/
  `SpeakingCard`/`AnimatedStat`) each fade/slide in individually with a small
  per-index delay (staggered effect) the first time they scroll into view,
  plus a consistent hover lift + soft blue shadow. Same pattern everywhere,
  not three different animation approaches.
- **Navbar**: gains a subtle shadow once the page scrolls past 8px (a cheap
  boolean state flip, not a per-pixel re-render — React bails out of
  re-rendering when the new state equals the old one). Active nav links get
  an animated underline (desktop) or filled pill (mobile).
- **Deliberately NOT animated: the Hero and any likely-LCP element** (the
  blog post cover image, for instance). Opacity/transform entrance
  animations on the Largest Contentful Paint element are a common way to
  accidentally hurt Core Web Vitals for very little UX benefit — and
  "entrance as it enters the viewport" doesn't really apply to something
  that's already in the viewport on load anyway. Everything above the fold
  renders immediately; only below-the-fold content animates in.
- **Deliberately NOT implemented: full page-transition animations.** Wrapping
  the entire route tree in `AnimatePresence`/a shared layout transition adds
  real client JS and interaction risk (double-render flicker, INP cost) for
  every navigation, sitewide — a heavy trade for a "nice to have" that was
  explicitly framed as optional ("if appropriate"). Per-section reveals and
  per-card hover/stagger effects deliver the "modern, professional" feel
  without that cost.

### SEO audit — what was actually broken

Every single page's Open Graph/Twitter image previously pointed at
`/images/og/default.png` — a file that never existed (only a `.gitkeep`
placeholder). Social share previews were silently broken sitewide. Fixed by:

- Making `ogImage` in `pageMetadata()` (`src/lib/seo.ts`) genuinely optional.
  Pages that don't pass one now fall back to a real, generated image instead
  of a dead path.
- Adding `src/app/opengraph-image.tsx` — a brand-colored 1200×630 image
  generated at build time via `next/og` (`ImageResponse`), zero external
  asset dependency. Applies automatically to Home, About, Community, Contact,
  and the listing pages.
- Case study pages now pass their first real screenshot as `ogImage`; blog
  posts already did (via their own `generateMetadata`, now also using shared
  helpers — see below).

### Other SEO improvements

- **`breadcrumbJsonLd()`** (`src/lib/seo.ts`) and **`<JsonLd>`**
  (`src/components/seo/JsonLd.tsx`) are new shared helpers — every page that
  needs a `BreadcrumbList` or `Article` schema now builds it the same way
  instead of hand-rolling the `<script type="application/ld+json">`
  boilerplate per page (Projects, case studies, About, Community, Contact,
  Blog listing, and blog posts all use these now).
- **`robots` directives** are explicit per page via `pageMetadata()`'s new
  `index` option — `false` on the "project not found" and "post not found"
  metadata branches and the 404 page, `true` (default) everywhere else,
  rather than leaving it implicit.
- **Keyword targeting** tightened on Home, About, Projects, Community, and
  Blog titles/descriptions to match this project's own documented SEO
  strategy (`portfolio-master-blueprint.md`'s "React Next.js developer
  Nairobi" / "DevOps community organizer Kenya" long-tail terms) — natural
  phrasing, not stuffing.
- **Heading hierarchy fix**: the Projects listing and Blog listing pages
  could skip straight from `h1` to `h3` (each card's title) whenever no
  intervening `h2` rendered — on Blog specifically, whenever there was no
  featured post (e.g., mid-filter). Both now have a visually-hidden `h2`
  ("All Case Studies" / "All Articles" or "Filtered Articles") so the
  document outline is always valid without changing anything visually.
- **Blog post `keywords`** meta now derived from the post's own tags —
  real, relevant terms already attached to that content, not invented ones.

### New dependencies

None. Everything above uses packages already in the project: `framer-motion`
(cards, reveals, navbar) and `next/og` (bundled with Next.js itself, no
install needed) for the generated OG image.

### Files touched in this pass

`lib/seo.ts` (rewritten), `components/seo/JsonLd.tsx` (new),
`app/opengraph-image.tsx` (new), `components/ui/RevealSection.tsx` (new,
introduced earlier for the About merge, now used sitewide),
`components/layout/Nav.tsx` (scroll shadow), `components/sections/ProjectCard.tsx`

- `ProjectGrid.tsx`, `components/blog/BlogCard.tsx` + `BlogGrid.tsx`
  (motion + stagger), `components/sections/CaseStudyLayout.tsx` (staggered
  body sections), `app/page.tsx`, `app/projects/page.tsx`,
  `app/projects/[slug]/page.tsx`, `app/contact/page.tsx`, `app/blog/page.tsx`,
  `app/blog/[slug]/page.tsx`, `app/community/page.tsx`, `app/about/page.tsx`,
  `app/not-found.tsx`, `app/layout.tsx` (all: breadcrumbs, reveals, and/or
  metadata improvements as applicable).

`components/ui/Card.tsx` is no longer used anywhere (ProjectCard/BlogCard now
own their markup directly for animation flexibility) but was left in place as
a generic design-system primitive rather than deleted.

## Timeline redesign ("The Path So Far")

The About page's career timeline (previously a plain left-aligned vertical
list) is now an alternating card timeline — a single center line on desktop
with milestones alternating left/right of it, collapsing to a left-aligned
line with all cards on the right on mobile (<768px). Three components now
make this up:

- **`TimelineNode.tsx`** — the circular marker on the line. Scales in from 0
  the first time it scrolls into view.
- **`TimelineItem.tsx`** — one milestone: node + card, sliding in from the
  left or right depending on which side of the line it's on. Cards use
  `rounded-2xl`, a soft shadow, and a hover state (slight lift, shadow
  enhancement, border tint to brand blue) — all via Framer Motion, matching
  the elevation style already used on `LeadershipCard`/`SpeakingCard`/
  `ProjectCard` elsewhere in the app rather than inventing a fourth hover
  treatment.
- **`Timeline.tsx`** — the container. Renders the center/left line as two
  layers: a static full-height track, and a gradient accent line on top of
  it whose vertical fill (`scaleY`) is tied to scroll progress via Framer
  Motion's `useScroll`/`useTransform` — it progressively "draws" as you
  scroll through the section. All content (dates, stage, institution,
  description, the "Parallel start" badge) is unchanged from before; only
  the layout and motion are new.

**How the alternating layout works without any JS-side breakpoint checks:**
each `TimelineItem` is its own CSS grid — `[2rem_1fr]` on mobile,
`[1fr_3rem_1fr]` from `md:` up. The node and card both shift which grid
column they occupy at the `md:` breakpoint (pure Tailwind responsive
classes), so the line and every node stay perfectly aligned at both layouts
with zero manual position math or `window.innerWidth` checks — just the grid
template doing the work.

**Reduced motion:** every animated piece (node scale-in, card slide-in, hover
elevation, and the scroll-progress line fill) is gated by
`useReducedMotion()`. With it enabled, the line renders fully filled
immediately and cards/nodes appear in their final state with no motion —
never partially hidden waiting on an animation that won't play.

## Content voice pass (human-first-writing)

A full copy review across every page and content file, using Anthropic's
`human-first-writing` skill, to cut anything that read templated or
AI-generated rather than like a person actually talking through their own
work. A few things worth knowing:

- **Real, user-supplied copy was left untouched.** The official taglines for
  InfoSec365 ("Collaborate. Innovate. Elevate"), Nairobi DevOps Community
  ("Innovate. Empower. Grow"), SpaceYaTech, and WTD Kenya are the
  organizations' actual descriptions, supplied directly — not AI-drafted
  filler, so they weren't rewritten. Same for `SITE_TAGLINE` ("The Builder
  Who Also Brings People Together") — Lawrence's own established brand line.
- **The three project case studies** (`src/content/projects/*.ts`) had the
  clearest issue: every field (Problem, Constraints, Decisions, etc.) across
  all three projects followed the same rhythm — a short fragment, then a
  longer sentence with an em-dash aside — six times per project, times
  three. Rewritten with real sentence-length variation and a more first-person,
  talking-through-it voice, with every fact (team sizes, stack, numbers,
  dates) unchanged.
- **The five Speaking Engagement descriptions** all opened with the identical
  "A [session/talk] on/about X" template. Rewritten so each one starts
  differently (some lead with "I walked through...", one with "What it
  actually takes...", one with "The case for...") rather than reading as five
  instances of the same fill-in-the-blank sentence.
- **A real voice inconsistency, not just an AI-tell:** the Community page's
  "Live Sessions & Content" copy was written in third person ("Lawrence runs
  the show") while every other first-person section on the site (About's
  Professional Summary, Personal Note, etc.) speaks as "I." Fixed to match.
- **A literal duplicate:** the Home and About pages used the exact same
  closing CTA heading, word for word ("Looking to hire, collaborate, or just
  say hi?"). About's was changed to avoid repeating it verbatim.
- **The About page's Professional Summary** repeated the intro paragraph's
  "still deepening my backend and cloud skills" phrasing almost verbatim, and
  closed on a resume-speak self-label ("frontend-strong and
  backend-curious"). Rewritten to say something different from the intro and
  to end on a plainer, more direct admission instead of a tidy label.
- **Left alone on purpose:** the timeline and education entries (short,
  scannable résumé-style fragments are the correct convention there, not a
  tell), the impact-stat captions (same reason), and the three Blog
  placeholder posts (explicitly dev-only scaffolding, shown with an on-page
  "these are placeholders" banner, and destined to disappear once Hashnode is
  connected — polishing throwaway demo copy wasn't worth the time against
  everything else in this pass).

Nothing here is detector-evasion — the goal was writing that reads like
Lawrence talking through his own work, not writing engineered to score
differently on an AI-detection tool. No facts, numbers, dates, or links
changed anywhere in this pass; only how the true things are said.

## Project structure

Mirrors `project-architecture.md` exactly:

```
src/
  app/            → routes (App Router)
  components/
    ui/           → Button, Badge, Card, Container, SectionHeading, BrandIcons
    layout/       → Nav, Footer, MobileMenu
    sections/     → Hero, StackHighlights, ProjectCard/Grid, CredibilityStrip,
                     CaseStudyLayout, Timeline, ContactForm
  content/
    projects/     → one .ts file per case study (typed against src/types/project.ts)
    certifications.ts, timeline.ts
  lib/            → constants.ts, utils.ts, seo.ts, hashnode.ts
  types/          → Project, BlogPost
  styles/fonts.ts → next/font config (Inter, Space Grotesk, JetBrains Mono, Caveat)
```

One notable deviation from the architecture doc: this Next.js version scaffolds
**Tailwind v4**, which uses CSS-based `@theme` config in `src/app/globals.css`
rather than a separate `tailwind.config.ts`. All the same brand tokens from
`branding-guide.md` are there — just declared as CSS custom properties instead.

## Adding a new project

Create one file in `src/content/projects/`, following the `Project` type, and
add it to the array in `src/content/projects/index.ts`. It'll automatically
appear in the grid and get a case study page at `/projects/<slug>` — no
component changes needed.

## Build & deploy

```bash
npm run build   # typecheck + production build
npm run lint
```

Designed for Vercel (native Next.js support, auto-deploy on merge to `main`).
Domain is not yet chosen — see `portfolio-master-blueprint.md`.
