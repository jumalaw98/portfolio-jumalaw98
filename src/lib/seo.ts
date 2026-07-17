import type { Metadata } from "next";
import { SITE_LOGO, SITE_NAME, SITE_URL } from "./constants";

interface PageMetadataInput {
  title: string;
  description: string;
  path?: string; // e.g. "/projects" — defaults to "/"
  /**
   * Absolute or root-relative URL to a real per-page image (a project
   * screenshot, a blog cover image, etc). Omit this for pages without one —
   * Next.js's `opengraph-image.tsx` file-convention (see app/opengraph-image.tsx)
   * supplies a generated, on-brand fallback automatically, so metadata never
   * points at a dead asset.
   */
  ogImage?: string;
  /** Set to false for pages that shouldn't be indexed (defaults to indexed). */
  index?: boolean;
}

/**
 * Builds per-page metadata (title, description, canonical URL, OpenGraph, Twitter card).
 * Usage in a page.tsx:
 *   export const metadata = pageMetadata({ title: "...", description: "..." })
 */
export function pageMetadata({
  title,
  description,
  path = "/",
  ogImage,
  index = true,
}: PageMetadataInput): Metadata {
  const url = new URL(path, SITE_URL).toString();
  const fullTitle = path === "/" ? `${title}` : `${title} — ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: {
      index,
      follow: index,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [{ url: SITE_LOGO, type: "image/svg+xml" }],
  },
  ...pageMetadata({
    // Long-tail terms match the site's own documented SEO strategy
    // (portfolio-master-blueprint.md — "React Next.js developer Nairobi",
    // "Kenya frontend developer portfolio", "DevOps community organizer Kenya").
    title: `${SITE_NAME} — React/Next.js Developer & Community Builder in Nairobi, Kenya`,
    description:
      "Lawrence Juma (jumalaw98) is a Nairobi-based React/Next.js developer growing into full-stack and DevOps, and a community organizer leading technical communities across East Africa. Portfolio, case studies, and writing.",
    path: "/",
  }),
};

/** Person schema (JSON-LD) for Home/About, per SEO Implementation plan in the blueprint. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    alternateName: "jumalaw98",
    url: SITE_URL,
    jobTitle: "React/Next.js Developer",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
  };
}

interface BreadcrumbItem {
  name: string;
  path: string; // root-relative, e.g. "/projects"
}

/**
 * Builds a BreadcrumbList JSON-LD object from a simple {name, path} list.
 * Centralized here so every page that needs breadcrumbs (Projects, case
 * studies, About, Community, Blog, Contact) builds the same shape rather
 * than hand-rolling the schema repeatedly.
 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
