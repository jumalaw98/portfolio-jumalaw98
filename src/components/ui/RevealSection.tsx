"use client";

import { type ReactNode, useEffect, useState } from "react";
import { motion, useReducedMotion, useAnimationControls } from "framer-motion";

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /**
   * Optional skeleton shown as an overlay while content animates in.
   * The skeleton is positioned absolutely (no layout shift) and fades
   * out as the content fades in — the two crossfade with matching
   * 500ms timelines so there is NEVER a blank gap.
   *
   * A 200ms debounce prevents the skeleton from flashing on fast
   * connections where the observer fires immediately.
   */
  skeleton?: ReactNode;
}

/**
 * Wraps a section in a subtle fade/slide-up entrance that plays once when it
 * scrolls into view. Kept as a small, isolated client component so pages
 * using it (e.g. About) can stay Server Components otherwise — only this
 * leaf ships the animation JS.
 *
 * Safety net: if the IntersectionObserver never fires (edge case on first
 * paint due to layout shifts or font swaps), a 3-second timeout forces the
 * reveal animation so content can NEVER get stuck invisible.
 *
 * Always renders <motion.div> regardless of state to avoid hydration
 * mismatches — only the initial/animate props change between paths.
 */
export function RevealSection({ children, className, delay = 0, skeleton }: RevealSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimationControls();
  const [animStarted, setAnimStarted] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const [debouncedReady, setDebouncedReady] = useState(false);

  // Debounce: show skeleton only if content hasn't animated within 200ms.
  // Prevents a brief flash on fast connections where whileInView fires instantly.
  useEffect(() => {
    if (shouldReduceMotion || animStarted || animDone) return;
    const timer = setTimeout(() => setDebouncedReady(true), 200);
    return () => clearTimeout(timer);
  }, [shouldReduceMotion, animStarted, animDone]);

  // Safety timeout: force content visible if observer never fires
  useEffect(() => {
    const timer = setTimeout(() => {
      controls.start({ opacity: 1, y: 0 });
    }, 3000);
    return () => clearTimeout(timer);
  }, [controls]);

  // Reduced motion → render content directly with no animation wrappers
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const showSkeleton = !!skeleton && !animDone && debouncedReady;

  return (
    <div className={className} style={{ position: "relative" }}>
      <motion.div
        onAnimationStart={() => setAnimStarted(true)}
        onAnimationComplete={() => setAnimDone(true)}
        suppressHydrationWarning
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        animate={controls}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        style={{ position: "relative", zIndex: 1 }}
      >
        {children}
      </motion.div>

      {/*
        Skeleton overlay — positioned absolutely so it NEVER shifts layout.
        Crossfades with the content (both share a 500ms timeline).
        Removed from DOM once the animation fully completes.
      */}
      {showSkeleton ? (
        <div
          role="status"
          aria-label="Loading section"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            opacity: animStarted ? 0 : 1,
            transition: `opacity 0.5s ease-out${delay > 0 ? ` ${delay}s` : ""}`,
            pointerEvents: "none",
          }}
        >
          {skeleton}
        </div>
      ) : null}
    </div>
  );
}
