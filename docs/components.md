# Components

## Overview

Components are organized by role into five directories under `src/components/`:

| Directory    | Purpose                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `layout/`    | Page shell: navigation, footer, mobile menu                                |
| `sections/`  | Page-level content sections (Hero, ProjectGrid, ContactForm, etc.)         |
| `ui/`        | Primitive, reusable UI components (Button, Badge, Card, Container)         |
| `seo/`       | Structured data utilities (JsonLd)                                         |
| `blog/`      | Blog-specific components (BlogCard, ArticleContent, TableOfContents, etc.) |
| `community/` | Community-specific components (LeadershipCard, SpeakingCard, etc.)         |

---

## UI Primitives

### `Container`

Max-width layout wrapper. Constrains content to 1280px (`max-w-6xl`) with
responsive horizontal padding.

```typescript
interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "main" | "article";
}
```

**Usage:**

```tsx
<Container className="py-16">…</Container>
<Container as="section">…</Container>
```

### `Button`

Hybrid component that renders as `<Link>` (when `href` is provided) or as
`<button>` (when no `href`). Three variants.

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
  className?: string;
  href?: string; // when present, renders as Link
  // ... plus all native <a> or <button> attributes
}
```

**Variants:**

| Variant     | Use Case                             |
| ----------- | ------------------------------------ |
| `primary`   | Primary CTA (orange background)      |
| `secondary` | Secondary action (blue background)   |
| `ghost`     | Subtle/border action (border + text) |

**Usage:**

```tsx
<Button href="/projects" variant="primary">View Projects</Button>
<Button variant="ghost">Cancel</Button>
<Button type="submit" disabled={isSubmitting}>Send</Button>
```

### `Badge`

Small pill label for tags and status indicators. Uses monospace font.

```typescript
interface BadgeProps {
  children: ReactNode;
  tone?: "blue" | "orange" | "neutral";
  className?: string;
}
```

**Usage:**

```tsx
<Badge tone="blue">TypeScript</Badge>
<Badge tone="orange">In Progress</Badge>
```

### `Card`

Generic content card with border, padding, and hover shadow.

```typescript
interface CardProps {
  children: ReactNode;
  className?: string;
}
```

### `SectionHeading`

Consistent section heading with optional eyebrow label and description.

```typescript
interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}
```

**Usage:**

```tsx
<SectionHeading
  eyebrow="Projects"
  title="Case Studies"
  description="Real problems, real decisions."
  align="center"
/>
```

### `RevealSection`

Client component that wraps content in a scroll-triggered fade/slide-up
animation. Ships Framer Motion JS only when used.

```typescript
interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}
```

- Respects `prefers-reduced-motion` — no animation when the user has
  reduced motion enabled.
- Animation plays once when the element scrolls into view (viewport margin
  of `-80px`).
- `suppressHydrationWarning` is set to handle Framer Motion SSR/CSR
  style differences.

---

## Layout Components

### `Nav`

Sticky navigation bar (`sticky top-0`) with:

- Site logo + branded name (`Jumalaw98` — blue text, orange numbers).
- Desktop nav links with animated active indicator.
- Mobile hamburger menu (toggles `MobileMenu` overlay).
- Background blur effect (`bg-white/90 backdrop-blur-sm`) + border on scroll.
- Uses `usePathname()` for active link detection.

### `Footer`

Site footer with:

- Tagline + signature (Caveat font).
- Nav links + Resume + Contact links.
- Social icons (LinkedIn, X/Twitter, Hashnode, GitHub, Credly).
- Copyright notice + "Built with Next.js" credit.

### `MobileMenu`

Full-screen mobile navigation overlay. Receives `pathname` and `onNavigate`
callback from `Nav`.

---

## Section Components

### `Hero`

Home page hero section with headline, subline, CTAs, and headshot image.

```typescript
interface HeroProps {
  headline: string;
  subline: string;
  headshotSrc?: string;
}
```

- The headshot is LCP-critical and uses `priority` on `next/image`.
- Two CTAs: "View My Work" (primary) and "Get In Touch" (ghost).

### `StackHighlights`

Interactive tech stack icon bar on the home page. Displays 8 brand icons
(React, Next.js, TypeScript, Tailwind, Docker, Azure, Cloudflare, GitHub
Actions) with hover tooltip and glow effect.

### `ProjectGrid`

Server component that renders a responsive grid of `ProjectCard` components.

```typescript
interface ProjectGridProps {
  readonly projects: readonly Project[];
}
```

3 columns on large screens, 2 on medium, 1 on small.

### `ProjectCard`

Client component with scroll-triggered entrance animation and hover elevation
effect. Displays:

- Title + optional "In Progress" badge.
- Stack tags as `Badge` components.
- Summary text.
- "Read Case Study" link with arrow icon.

### `CaseStudyLayout`

Article layout for individual case studies. Renders:

- Header with role, timeframe, title, stack badges, live URL link.
- Screenshot gallery (2-column grid).
- Sequential sections (Problem, Constraints, Decisions, What Was Built,
  Outcome, Reflection) with scroll-reveal animations.
- Footer with "Next Case Study" navigation and CTA.

### `ContactForm`

Client component with full form lifecycle:

| State        | Behavior                                         |
| ------------ | ------------------------------------------------ |
| `idle`       | Form displayed, empty field errors cleared       |
| `submitting` | Button shows "Sending…", double-submit prevented |
| `success`    | Success message replaces form                    |
| `error`      | Error message displayed, form remains editable   |

**Features:**

- Client-side validation using shared `validation.ts` code.
- Honeypot field (hidden from humans, traps bots).
- Submission ID for idempotent retries.
- Field-level error messages with `aria-invalid` and `aria-describedby`.
- Screen-reader announcements via `aria-live` region.
- Auto-focus on first error field.

### `CredibilityStrip`

Dark blue section on the home page displaying key metrics (attendees,
speakers, community members) as a definition list.

### `Timeline`

Career timeline with scroll-progress line fill. Renders `TimelineItem`
components, each containing a `TimelineNode` (circle dot).

---

## Blog Components

### `BlogGrid`

Server component that renders a responsive grid of `BlogCard` components.

### `BlogGridClient`

Client version of `BlogGrid` that supports random shuffle with a deterministic
seed (uses `crypto.randomUUID()` server-side, passes seed to client).

### `BlogCard`

Client component with scroll-triggered entrance animation. Displays cover
image, tags, title, brief, date, and reading time.

### `FeaturedPost`

Large hero card for the most recent blog post (first page only).

### `ArticleContent`

Renders Hashnode article HTML (`dangerouslySetInnerHTML`) with safe CSS
scoping. Does not sanitize — Hashnode content is first-party.

### `TableOfContents`

Sticky sidebar that extracts headings from the rendered article HTML and
highlights the currently visible section via Intersection Observer.

### `ReadingProgress`

Fixed-position progress bar at the top of the viewport that fills as the
user scrolls through an article.

### `SearchBox`

Text input that updates URL search params for `q` query. Client-side filtering
is applied on the server by `BlogPage`.

### `TagFilter`

Horizontal scrollable row of tag buttons that update URL search params for
`tag`. Shows the top 5 most-used tags, always keeping the active tag visible.

### `Pagination`

Page navigation with numbered buttons. Generates correct URLs with `tag`,
`q`, and `page` params preserved.

### `ShareButtons`

Share buttons for article URLs: copy-to-clipboard and native Web Share API
(desktop) with fallback.

### `PostNavigation`

Previous/next post links with title and date.

### `RelatedPosts`

Grid of up to 3 related posts (sharing at least one tag with the current
article).

### `Skeletons`

Animated placeholder components for loading states (used as `Suspense`
fallbacks).

---

## Community Components

### `LeadershipCard`

Client component with entrance animation. Displays organization logo
(or initials fallback), role title, description, responsibilities list,
tags, and social/website links.

### `LeadershipGrid`

Responsive grid of `LeadershipCard` components (2 columns on medium screens).

### `SpeakingCard`

Client component with entrance animation. Displays talk title, event name,
location, date, description, tags, and optional resource links (slides,
video).

### `SpeakingGrid`

Responsive grid of `SpeakingCard` components.

### `ImpactStatsGrid`

Grid of animated stat numbers (count-up animation on scroll). Each stat
shows value, label, optional description, and optional "approx" marker.

### `AnimatedStat`

Client component that animates a number from 0 to its target value using
Framer Motion's `useSpring` and `useTransform`.

---

## SEO Components

### `JsonLd`

Renders a `<script type="application/ld+json">` tag from a plain object.

```typescript
interface JsonLdProps {
  data: object;
}
```

Used across the site for:

- **Person schema** — root layout (Home/About).
- **BreadcrumbList** — every sub-page.
- **Article schema** — blog post pages.
