"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { TimelineItem } from "./TimelineItem";
import type { TimelineEntry } from "@/content/timeline";

interface TimelineProps {
  entries: TimelineEntry[];
}

/**
 * Alternating vertical timeline: a single center line on desktop (moves to
 * the left edge on mobile, per the responsive grid template each
 * TimelineItem uses), with milestones alternating left/right of it. The
 * line itself progressively fills as the section scrolls through the
 * viewport — a purely decorative touch, so it's skipped entirely (line
 * shows fully filled immediately) under `prefers-reduced-motion`.
 */
export function Timeline({ entries }: Readonly<TimelineProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 60%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative">
      {/* Static track */}
      <div
        aria-hidden="true"
        className="absolute left-4 top-0 h-full w-0.5 -translate-x-1/2 bg-border md:left-1/2"
      />
      {/* Animated, progressively-revealed accent line */}
      <motion.div
        aria-hidden="true"
        className="absolute left-4 top-0 h-full w-0.5 origin-top -translate-x-1/2 bg-gradient-to-b from-brand-blue to-brand-orange md:left-1/2"
        initial={{ scaleY: shouldReduceMotion ? 1 : 0 }}
        style={{ scaleY: shouldReduceMotion ? 1 : lineScale }}
      />

      <ol className="relative flex flex-col">
        {entries.map((entry, i) => (
          <TimelineItem
            key={`${entry.institution}-${i}`}
            entry={entry}
            index={i}
            side={i % 2 === 0 ? "left" : "right"}
          />
        ))}
      </ol>
    </div>
  );
}
