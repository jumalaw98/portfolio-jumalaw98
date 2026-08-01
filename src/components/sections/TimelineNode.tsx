"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineNodeProps {
  readonly accent?: boolean;
}

export function getTimelineNodeAnimate(reduced: boolean) {
  return reduced ? { scale: 1, opacity: 1 } : undefined;
}

/**
 * The circular marker on the timeline's center/left line. Sits in the same
 * grid column as the line itself (see Timeline.tsx), so no manual position
 * math is needed to keep it centered on the line at any breakpoint.
 */
export function TimelineNode({ accent = false }: TimelineNodeProps) {
  // useReducedMotion() returns null during SSR. Treat null the same as
  // false (normal motion): both get the hidden initial state so Framer
  // Motion captures it on mount and the scale-in reveal plays. The
  // animate target only nudges reduced-motion clients to visible.
  const shouldReduceMotion = useReducedMotion() === true;

  return (
    <motion.span
      aria-hidden="true"
      className={cn(
        "relative z-10 block h-4 w-4 shrink-0 rounded-full border-4 border-white ring-2 ring-offset-0",
        accent ? "bg-brand-orange ring-brand-orange-light" : "bg-brand-blue ring-brand-blue-light",
      )}
      style={{ boxShadow: "0 0 0 4px white" }}
      suppressHydrationWarning
      // Normal-motion: hidden on first render so Framer Motion captures the
      // initial state on mount and the scale-in reveal plays when in view.
      // Reduced-motion: initial is undefined (server renders visible); the
      // animate target below nudges the client to the final state.
      // suppressHydrationWarning handles the SSR/client mismatch.
      initial={shouldReduceMotion ? undefined : { scale: 0, opacity: 0 }}
      // When reduced motion is enabled, provide a live animate target so
      // toggling the preference at runtime places the node in its final
      // visible state even before it enters the viewport.
      whileInView={shouldReduceMotion ? undefined : { scale: 1, opacity: 1 }}
      animate={getTimelineNodeAnimate(shouldReduceMotion)}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    />
  );
}
