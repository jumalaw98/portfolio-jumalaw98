"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useAnimationControls, useInView } from "framer-motion";
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
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Intentionally set after mount to avoid hydration mismatches with
    // framer-motion's `initial` prop — the component server-renders with
    // no animation state, then enables entrance animations on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Drive the entrance animation after mount so SSR HTML is always visible.
  // For reduced-motion users, jump straight to visible. For normal-motion,
  // set hidden state via `initial`, then animate to visible when in view.
  useEffect(() => {
    if (shouldReduceMotion) {
      controls.set({ scale: 1, opacity: 1 });
      return;
    }
    // Normal-motion: animate only when the node scrolls into view
    if (isInView) {
      controls.start({ scale: 1, opacity: 1 });
    }
  }, [shouldReduceMotion, isInView, controls]);

  return (
    <motion.span
      ref={ref}
      aria-hidden="true"
      className={cn(
        "relative z-10 block h-4 w-4 shrink-0 rounded-full border-4 border-white ring-2 ring-offset-0",
        accent ? "bg-brand-orange ring-brand-orange-light" : "bg-brand-blue ring-brand-blue-light",
      )}
      style={{ boxShadow: "0 0 0 4px white" }}
      initial={mounted && !shouldReduceMotion ? { scale: 0, opacity: 0 } : undefined}
      animate={controls}
      whileInView={shouldReduceMotion ? undefined : { scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    />
  );
}
