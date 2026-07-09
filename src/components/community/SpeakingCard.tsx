"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, PlayCircle, ExternalLink, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { SpeakingEngagement } from "@/content/community";

interface SpeakingCardProps {
  talk: SpeakingEngagement;
  priority?: boolean;
}

export function SpeakingCard({ talk, priority = false }: SpeakingCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const hasResources = Boolean(
    talk.resources?.slidesUrl || talk.resources?.videoUrl || talk.resources?.eventPageUrl,
  );

  return (
    <motion.article
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white"
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
              boxShadow:
                "0 12px 24px -8px rgba(28, 118, 181, 0.18), 0 0 0 1px rgba(28, 118, 181, 0.25)",
            }
      }
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      {talk.imageUrl ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={talk.imageUrl}
            alt=""
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {talk.date}
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} />
            {talk.location}
          </span>
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug text-brand-ink transition-colors group-hover:text-brand-blue">
          {talk.talk}
        </h3>
        <p className="mt-1 text-sm font-medium text-brand-blue-dark">{talk.event}</p>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-text-body">
          {talk.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {talk.tags.map((tag) => (
            <Badge key={tag} tone="blue" className="transition-colors group-hover:bg-brand-blue-light group-hover:text-white">
              {tag}
            </Badge>
          ))}
        </div>

        {hasResources ? (
          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
            {talk.resources?.slidesUrl ? (
              <ResourceLink
                href={talk.resources.slidesUrl}
                label={`View slides for ${talk.talk}`}
                Icon={FileText}
              >
                Slides
              </ResourceLink>
            ) : null}
            {talk.resources?.videoUrl ? (
              <ResourceLink
                href={talk.resources.videoUrl}
                label={`Watch recording of ${talk.talk}`}
                Icon={PlayCircle}
              >
                Watch
              </ResourceLink>
            ) : null}
            {talk.resources?.eventPageUrl ? (
              <ResourceLink
                href={talk.resources.eventPageUrl}
                label={`View event page for ${talk.event}`}
                Icon={ExternalLink}
              >
                Event Page
              </ResourceLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

interface ResourceLinkProps {
  href: string;
  label: string;
  Icon: typeof FileText;
  children: ReactNode;
}

function ResourceLink({ href, label, Icon, children }: ResourceLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue transition-colors hover:text-brand-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
    >
      <Icon size={16} />
      {children}
    </a>
  );
}
