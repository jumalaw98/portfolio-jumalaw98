// Single source of truth for name, contact info, and social links.
// Every component that needs these (Footer, Nav, Contact page, SEO metadata)
// imports from here — update once, propagates everywhere.
// Source: portfolio-content.md Section 5b.

export const SITE_NAME = "Lawrence Juma";
export const SITE_ALIAS = "jumalaw98";
export const SITE_TAGLINE = "The Builder Who Also Brings People Together.";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://jumalaw98.vercel.app";

export const CONTACT_EMAIL = "jumalawrence98@gmail.com";

export const SOCIAL_LINKS = {
  linkedin: "https://linkedin.com/in/jumalaw98",
  twitter: "https://x.com/jumalaw98",
  instagram: "https://instagram.com/jumalaw98",
  github: "https://github.com/jumalaw98",
  hashnode: "https://jumalaw98.hashnode.dev/",
  credly: "https://www.credly.com/users/jumalaw98/badges",
} as const;

export const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Community", href: "/community" },
  { label: "Blog", href: "/blog" },
] as const;

// Resume now lives as a section within /about (id="resume") rather than a
// standalone page — see app/about/page.tsx and the /resume redirect in
// next.config.ts. Referenced from the Footer and the About page's own CTAs.
export const RESUME_ANCHOR = "/about#resume";

export const PRIMARY_CTA = { label: "Contact", href: "/contact" } as const;

export const STACK_HIGHLIGHTS = [
  "React",
  "Next.js",
  "TypeScript",
  "Tailwind",
  "Docker",
  "Azure",
  "Cloudflare",
  "GitHub Actions",
] as const;

// Quick Credibility Strip — Home page. Source: portfolio-content.md Section 1g.
// Deliberately excludes the $13,570 volunteer campaign stat — that belongs to
// an unrelated role (Section 8a), not community/dev work.
export const CREDIBILITY_STATS = [
  { value: "200+", label: "attendees — Africa DevOps Summit 2025" },
  { value: "10+", label: "speakers & 10+ partners/sponsors" },
  { value: "4,000+", label: "community members, Nairobi DevOps Community" },
  { value: "Azure & Cloudflare", label: "production deployments" },
] as const;
