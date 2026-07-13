"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Globe, Calendar, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import type { CommunityRole } from "@/content/community";

interface LeadershipCardProps {
  role: CommunityRole;
  index?: number;
}

const LOGO_PALETTE = [
  "bg-brand-blue",
  "bg-brand-orange",
  "bg-brand-blue-dark",
  "bg-brand-orange-dark",
];

// ---------------------------------------------------------------------------
// Sub-components extracted to reduce cognitive complexity of LeadershipCard
// ---------------------------------------------------------------------------

interface LogoBlockProps {
  logoUrl?: string;
  logoInitials?: string;
  org: string;
  paletteIndex: number;
}

function LogoBlock({ logoUrl, logoInitials, org, paletteIndex }: Readonly<LogoBlockProps>) {
  const containerClass = logoUrl
    ? "bg-white ring-1 ring-border"
    : LOGO_PALETTE[paletteIndex % LOGO_PALETTE.length];

  return (
    <div
      className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105 ${containerClass}`}
    >
      {logoUrl ? (
        <Image src={logoUrl} alt={`${org} logo`} fill sizes="56px" className="object-contain p-2" />
      ) : (
        <span className="font-display text-lg font-bold text-white" aria-hidden="true">
          {logoInitials}
        </span>
      )}
    </div>
  );
}

interface ResponsibilitiesListProps {
  items: string[];
}

function ResponsibilitiesList({ items }: Readonly<ResponsibilitiesListProps>) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm text-text-body">
          <span
            className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-orange"
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

interface LinksSectionProps {
  org: string;
  links: CommunityRole["links"];
}

const LINK_ITEM_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-body transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";

function LinksSection({ org, links }: Readonly<LinksSectionProps>) {
  if (!links) return null;

  const hasAnyLink = Boolean(
    links.website || links.github || links.linkedin || links.meetup || links.discord,
  );

  if (!hasAnyLink) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
      {links.website ? (
        <a
          href={links.website}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${org} website (opens in a new tab)`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue transition-colors hover:text-brand-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <Globe size={16} />
          Visit Community
        </a>
      ) : null}
      {links.github ? (
        <a
          href={links.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${org} on GitHub (opens in a new tab)`}
          className={LINK_ITEM_CLASS}
        >
          <GithubIcon width={15} height={15} />
        </a>
      ) : null}
      {links.linkedin ? (
        <a
          href={links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${org} on LinkedIn (opens in a new tab)`}
          className={LINK_ITEM_CLASS}
        >
          <LinkedinIcon width={15} height={15} />
        </a>
      ) : null}
      {links.meetup ? (
        <IconLink
          href={links.meetup}
          label={`${org} on Meetup (opens in a new tab)`}
          Icon={Calendar}
        />
      ) : null}
      {links.discord ? (
        <IconLink
          href={links.discord}
          label={`${org} on Discord (opens in a new tab)`}
          Icon={MessageCircle}
        />
      ) : null}
    </div>
  );
}

interface IconLinkProps {
  href: string;
  label: string;
  Icon: typeof Calendar;
}

function IconLink({ href, label, Icon }: Readonly<IconLinkProps>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={LINK_ITEM_CLASS}
    >
      <Icon size={15} />
    </a>
  );
}

// ---------------------------------------------------------------------------
// Main component – now with significantly reduced cognitive complexity
// ---------------------------------------------------------------------------

export function LeadershipCard({ role, index = 0 }: Readonly<LeadershipCardProps>) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Pre-compute motion props to keep JSX clean
  const animate = !shouldReduceMotion && mounted;
  const motionProps = {
    initial: animate ? { opacity: 0, y: 16 } : undefined,
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" } as const,
    transition: { duration: 0.4, delay: shouldReduceMotion ? 0 : index * 0.06 },
    whileHover: shouldReduceMotion
      ? undefined
      : {
          y: -4,
          boxShadow:
            "0 12px 24px -8px rgba(28, 118, 181, 0.18), 0 0 0 1px rgba(28, 118, 181, 0.25)",
        },
  };

  return (
    <motion.article
      className="group flex h-full flex-col rounded-lg border border-border bg-white p-6"
      {...motionProps}
    >
      <div className="flex items-start gap-4">
        <LogoBlock
          logoUrl={role.logoUrl}
          logoInitials={role.logoInitials}
          org={role.org}
          paletteIndex={index}
        />

        <div>
          <h3 className="text-lg font-semibold leading-snug text-brand-ink">{role.org}</h3>
          <p className="text-sm font-medium text-brand-blue-dark">{role.role}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
            <Calendar size={13} />
            {role.dates}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-text-body">{role.description}</p>

      <ResponsibilitiesList items={role.responsibilities ?? []} />

      <div className="mt-4 flex flex-wrap gap-2">
        {role.tags.map((tag) => (
          <Badge
            key={tag}
            tone="blue"
            className="transition-colors group-hover:bg-brand-blue-light group-hover:text-white"
          >
            {tag}
          </Badge>
        ))}
      </div>

      <LinksSection org={role.org} links={role.links} />
    </motion.article>
  );
}
