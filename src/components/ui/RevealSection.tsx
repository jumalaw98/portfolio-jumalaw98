"use client";

import { useEffect, useState, type ReactNode } from "react";
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
 * The `initial` prop is deferred until after client mount to prevent a React
 * hydration mismatch — Framer Motion's internal ref resolution differs
 * between server and client, so we avoid rendering `initial` styles on the
 * server entirely.
 */
export function RevealSection({ children, className, delay = 0 }: RevealSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <motion.div
      className={className}
      initial={mounted && !shouldReduceMotion ? { opacity: 0, y: 20 } : undefined}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
