"use client";

import { useEffect } from "react";
import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineNodeProps {
  readonly accent?: boolean;
}

/**
 * The circular marker on the timeline's center/left line. Sits in the same
 * grid column as the line itself (see Timeline.tsx), so no manual position
 * math is needed to keep it centered on the line at any breakpoint.
 */
export function TimelineNode({ accent = false }: TimelineNodeProps) {
  const shouldReduceMotion = useReducedMotion() === true;
  const controls = useAnimationControls();

  // Drive the entrance animation after mount so SSR HTML is always visible.
  // For reduced-motion users, jump straight to visible. For normal-motion,
  // hide via controls.set first, then animate to visible when in view.
  useEffect(() => {
    if (shouldReduceMotion) {
      controls.set({ scale: 1, opacity: 1 });
      return;
    }
    // Normal-motion: apply hidden state first (initial prop is ignored after
    // mount, so controls.set is the only reliable way), then reveal on scroll.
    controls.set({ scale: 0, opacity: 0 });
  }, [shouldReduceMotion, controls]);

  return (
    <motion.span
      aria-hidden="true"
      className={cn(
        "relative z-10 block h-4 w-4 shrink-0 rounded-full border-4 border-white ring-2 ring-offset-0",
        accent ? "bg-brand-orange ring-brand-orange-light" : "bg-brand-blue ring-brand-blue-light",
      )}
      style={{ boxShadow: "0 0 0 4px white" }}
      initial={undefined}
      animate={controls}
      whileInView={shouldReduceMotion ? undefined : { scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    />
  );
}
