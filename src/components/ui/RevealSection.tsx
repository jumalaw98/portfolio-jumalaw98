"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Wraps a section in a subtle fade/slide-up entrance that plays once when it
 * scrolls into view. Kept as a small, isolated client component so pages
 * using it (e.g. About) can stay Server Components otherwise — only this
 * leaf ships the animation JS.
 *
 * `suppressHydrationWarning` is set on the motion element because Framer
 * Motion may render inline styles during SSR that differ from the client
 * hydration pass. The prop silences those harmless mismatches while keeping
 * the entrance animation intact from first paint.
 */
export function RevealSection({ children, className, delay = 0 }: RevealSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      suppressHydrationWarning
      initial={!shouldReduceMotion ? { opacity: 0, y: 20 } : undefined}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
