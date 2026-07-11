"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { TimelineNode } from "./TimelineNode";
import { cn } from "@/lib/utils";
import type { TimelineEntry } from "@/content/timeline";

interface TimelineItemProps {
  entry: TimelineEntry;
  side: "left" | "right";
  index: number;
}

export function TimelineItem({ entry, side, index }: TimelineItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const isLeft = side === "left";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <li
      className="grid grid-cols-[2rem_1fr] gap-x-4 md:grid-cols-[1fr_3rem_1fr] md:gap-x-8"
    >
      {/* Node — same grid column as the line at every breakpoint, so it
          always sits exactly on top of it with no manual position math. */}
      <div className="col-start-1 row-start-1 flex justify-center pt-1 md:col-start-2">
        <TimelineNode accent={entry.parallelStart} />
      </div>

      {/* Card — right of the line on mobile always; alternates left/right
          on desktop depending on `side`. */}
      <motion.div
        className={cn(
          "col-start-2 row-start-1 pb-10 md:pb-16",
          isLeft ? "md:col-start-1 md:row-start-1" : "md:col-start-3 md:row-start-1",
        )}
        initial={
          mounted && !shouldReduceMotion
            ? { opacity: 0, x: isLeft ? -28 : 28, scale: 0.97 }
            : undefined
        }
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.2), ease: "easeOut" }}
      >
        <motion.div
          className={cn(
            "rounded-2xl border border-border bg-white p-6 shadow-sm transition-colors duration-300",
            isLeft ? "md:text-right" : "",
          )}
          whileHover={
            shouldReduceMotion
              ? undefined
              : {
                  y: -4,
                  borderColor: "#1C76B5",
                  boxShadow:
                    "0 16px 32px -12px rgba(28, 118, 181, 0.22), 0 0 0 1px rgba(28, 118, 181, 0.18)",
                }
          }
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div
            className={cn(
              "flex flex-wrap items-center gap-2",
              isLeft ? "md:justify-end" : "",
            )}
          >
            <p className="font-mono text-xs text-text-muted">{entry.dates}</p>
            {entry.parallelStart ? <Badge tone="orange">Parallel start</Badge> : null}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-brand-ink">{entry.stage}</h3>
          <p className="text-sm font-medium text-brand-blue-dark">{entry.institution}</p>
          <p className="mt-2 text-sm leading-relaxed text-text-body">
            {entry.description}
          </p>
        </motion.div>
      </motion.div>
    </li>
  );
}
