"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineNodeProps {
  accent?: boolean;
}

/**
 * The circular marker on the timeline's center/left line. Sits in the same
 * grid column as the line itself (see Timeline.tsx), so no manual position
 * math is needed to keep it centered on the line at any breakpoint.
 */
export function TimelineNode({ accent = false }: TimelineNodeProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.span
      aria-hidden="true"
      className={cn(
        "relative z-10 block h-4 w-4 shrink-0 rounded-full border-4 border-white ring-2 ring-offset-0",
        accent ? "bg-brand-orange ring-brand-orange-light" : "bg-brand-blue ring-brand-blue-light",
      )}
      style={{ boxShadow: "0 0 0 4px white" }}
      initial={mounted && !shouldReduceMotion ? { scale: 0, opacity: 0 } : undefined}
      whileInView={shouldReduceMotion ? undefined : { scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    />
  );
}
