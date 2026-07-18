# Project Structure

```
jumalaw98-portfolio/
├── .github/
│   ├── dependabot.yml              # Dependabot config (npm + Actions)
│   └── workflows/
│       ├── ci.yml                  # 3-tier CI pipeline
│       └── codeql-analysis.yml     # CodeQL security analysis
│
├── .vscode/                        # Shared VS Code settings
├── docs/                           # Project documentation (this directory)
├── public/                         # Static assets
├── src/                            # Application source code
│
│   ├── app/                        # Next.js App Router pages & API
│   │   ├── globals.css             # Tailwind v4 @theme + prose styles
│   │   ├── layout.tsx              # Root layout (Nav, Footer, JSON-LD)
│   │   ├── not-found.tsx           # Custom 404 page
│   │   ├── opengraph-image.tsx     # Generated OG image fallback
│   │   ├── robots.ts               # robots.txt
│   │   ├── sitemap.ts              # Dynamic sitemap.xml
│   │   │
│   │   ├── page.tsx                # Home page
│   │   ├── about/
│   │   │   └── page.tsx            # About + Resume page
│   │   ├── contact/
│   │   │   └── page.tsx            # Contact page (shell + dynamic form)
│   │   ├── projects/
│   │   │   ├── page.tsx            # Project listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Individual case study
│   │   ├── blog/
│   │   │   ├── page.tsx            # Blog listing (tag filter, search, pagination)
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx        # Individual blog post
│   │   │   └── rss.xml/
│   │   │       └── route.ts        # Generated RSS feed
│   │   ├── community/
│   │   │   └── page.tsx            # Community & Speaking page
│   │   ├── s/
│   │   │   └── [code]/
│   │   │       └── page.tsx        # Blog short-link redirects
│   │   └── api/
│   │       └── contact/
│   │           └── route.ts        # Contact form POST endpoint
│   │
│   ├── components/
│   │   ├── blog/                   # Blog-specific components
│   │   │   ├── ArticleContent.tsx  # Renders article HTML safely
│   │   │   ├── BlogCard.tsx        # Individual blog post card
│   │   │   ├── BlogGrid.tsx        # Server-component blog grid
│   │   │   ├── BlogGridClient.tsx  # Client-side blog grid (shuffled)
│   │   │   ├── FeaturedPost.tsx    # Featured post hero
│   │   │   ├── Pagination.tsx      # Page navigation
│   │   │   ├── PostNavigation.tsx  # Previous/next post links
│   │   │   ├── ReadingProgress.tsx # Scroll progress bar
│   │   │   ├── RelatedPosts.tsx    # Related posts grid
│   │   │   ├── SearchBox.tsx       # Client-side search
│   │   │   ├── ShareButtons.tsx    # Share URL + clipboard
│   │   │   ├── Skeletons.tsx       # Loading placeholders
│   │   │   ├── TableOfContents.tsx # Sticky heading navigation
│   │   │   ├── TagFilter.tsx       # Tag-based filtering
│   │   │   └── blogFormat.ts       # Date/time formatting helpers
│   │   │
│   │   ├── community/              # Community page components
│   │   │   ├── AnimatedStat.tsx    # Count-up stat animation
│   │   │   ├── ImpactStatsGrid.tsx # Stats dashboard grid
│   │   │   ├── LeadershipCard.tsx  # Community role card
│   │   │   ├── LeadershipGrid.tsx  # Leadership roles grid
│   │   │   ├── SpeakingCard.tsx    # Speaking engagement card
│   │   │   └── SpeakingGrid.tsx    # Speaking engagements grid
│   │   │
│   │   ├── layout/                 # Layout shell components
│   │   │   ├── Footer.tsx          # Site footer
│   │   │   ├── MobileMenu.tsx      # Mobile navigation overlay
│   │   │   └── Nav.tsx             # Sticky navigation bar
│   │   │
│   │   ├── sections/               # Page section components
│   │   │   ├── CaseStudyLayout.tsx # Case study article layout
│   │   │   ├── ContactForm.tsx     # Contact form (client)
│   │   │   ├── CredibilityStrip.tsx# Home page stats strip
│   │   │   ├── Hero.tsx            # Home page hero
│   │   │   ├── JumpNav.tsx         # Anchored jump navigation
│   │   │   ├── ProjectCard.tsx     # Project card (animated)
│   │   │   ├── ProjectGrid.tsx     # Project cards grid
│   │   │   ├── StackHighlights.tsx # Tech stack icon bar
│   │   │   ├── Timeline.tsx        # Career timeline
│   │   │   ├── TimelineItem.tsx    # Timeline entry
│   │   │   └── TimelineNode.tsx    # Timeline dot node
│   │   │
│   │   ├── seo/
│   │   │   └── JsonLd.tsx          # JSON-LD structured data renderer
│   │   │
│   │   └── ui/                     # Primitive UI components
│   │       ├── Badge.tsx           # Pill badge (stack tags, status)
│   │       ├── BrandIcons.tsx      # SVG brand icons (React, Docker, etc.)
│   │       ├── Button.tsx          # Link + button hybrid component
│   │       ├── Card.tsx            # Generic content card
│   │       ├── Container.tsx       # Max-width layout wrapper
│   │       ├── RevealSection.tsx   # Scroll-triggered animation wrapper
│   │       └── SectionHeading.tsx  # Section title + eyebrow + description
│   │
│   ├── content/                    # Static content data
│   │   ├── projects/               # One file per case study
│   │   │   ├── index.ts            # Barrel export + content queries
│   │   │   ├── africa-devops-summit.ts
│   │   │   ├── faithfulhearts-equine-learning-center.ts
│   │   │   ├── kommuniti-africa.ts
│   │   │   ├── nairobi-devops-community.ts
│   │   │   └── pretalx-azure.ts
│   │   ├── blog-placeholder.ts     # Fallback posts (no Hashnode)
│   │   ├── certifications.ts       # Certification data
│   │   ├── community.ts            # Leadership roles + speaking engagements
│   │   ├── education.ts            # Education entries
│   │   ├── impact-stats.ts         # Aggregated impact numbers
│   │   └── timeline.ts             # Career timeline milestones
│   │
│   ├── lib/                        # Shared utilities & business logic
│   │   ├── constants.ts            # Site name, URLs, social links, nav
│   │   ├── hashnode/               # Hashnode RSS integration
│   │   │   ├── index.ts            # Public API barrel
│   │   │   ├── posts.ts            # Post retrieval + mapping
│   │   │   └── rss.ts              # RSS fetch + XML parsing
│   │   ├── instrument.ts           # Server monitoring (logs, webhooks, email)
│   │   ├── project-images.ts       # ImageKit image URLs
│   │   ├── rate-limit.ts           # Rate limiter (Upstash + in-memory fallback)
│   │   ├── seo.ts                  # Metadata builders, JSON-LD helpers
│   │   ├── shortId.ts              # Deterministic short IDs (DJB2 hash)
│   │   ├── utils.ts                # cn(), isNavLinkActive()
│   │   └── validation.ts           # Contact form validation (client + server)
│   │
│   ├── styles/
│   │   └── fonts.ts               # next/font configuration (4 families)
│   │
│   └── types/
│       ├── blogPost.ts             # BlogPost, BlogPostDetail, BlogTag, BlogAuthor
│       └── project.ts              # Project, ProjectStatus
│
├── .env.local.example              # Environment variable template
├── .gitignore                      # Git ignore rules (commented)
├── .nvmrc                          # Node.js 22
├── .prettierignore                 # Prettier ignore rules
├── .prettierrc                     # Prettier config
├── AGENTS.md                       # Agent coding instructions
├── CLAUDE.md                       # Claude AI config
├── eslint.config.mjs               # ESLint flat config
├── next.config.ts                  # Next.js config (headers, redirects, images)
├── package.json                    # Dependencies & scripts
├── postcss.config.mjs              # PostCSS config (Tailwind)
├── README.md                       # Project README (entry point to docs)
└── tsconfig.json                   # TypeScript config (strict mode, path aliases)
```

## Path Aliases

The project uses the `@/` path alias (configured in `tsconfig.json`):

| Alias | Maps to   |
| ----- | --------- |
| `@/*` | `./src/*` |

Example: `import { Button } from "@/components/ui/Button"` resolves to
`src/components/ui/Button.tsx`.
