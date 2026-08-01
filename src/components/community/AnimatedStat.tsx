"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, useAnimationControls, animate } from "framer-motion";
import { Users, Mic, Building2, CalendarDays, Globe2, Rocket } from "lucide-react";
import type { ImpactStat, ImpactStatIconKey } from "@/content/impact-stats";

// Icon components live here, on the client — the content file only carries a
// serializable string key, since component references can't cross the
// server-to-client boundary as props.
const ICONS: Record<ImpactStatIconKey, typeof Users> = {
  users: Users,
  mic: Mic,
  building: Building2,
  calendar: CalendarDays,
  rocket: Rocket,
  globe: Globe2,
};

interface AnimatedStatProps {
  readonly stat: ImpactStat;
  readonly index?: number;
}

export function AnimatedStat({ stat, index = 0 }: AnimatedStatProps) {
  const ref = useRef<HTMLDivElement>(null);
  // `once: true` — the count-up plays a single time per page load, the
  // moment the stat scrolls into view, and never re-triggers.
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [displayValue, setDisplayValue] = useState(stat.value);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const controls = useAnimationControls();
  const Icon = ICONS[stat.icon];

  // Drive the entrance animation after mount so SSR HTML is always visible.
  // For reduced-motion users, jump straight to visible. For normal-motion,
  // set hidden state first, then animate to visible when in view.
  useEffect(() => {
    if (shouldReduceMotion) {
      controls.set({ opacity: 1, y: 0 });
      return;
    }
    // Normal-motion: set hidden state first, then animate when in view
    controls.set({ opacity: 0, y: 16 });
    if (isInView) {
      controls.start({ opacity: 1, y: 0 });
    }
  }, [shouldReduceMotion, isInView, controls]);

  useEffect(() => {
    if (!isInView) return;

    if (shouldReduceMotion) {
      // Reduced-motion path: jump straight to the final value once in view,
      // rather than animating — a one-time sync, not a cascading update.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayValue(stat.value);
      return;
    }

    setDisplayValue(0);

    const animControls = animate(0, stat.value, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });

    return () => animControls.stop();
  }, [isInView, shouldReduceMotion, stat.value]);

  return (
    <motion.div
      ref={ref}
      className="rounded-lg border border-border bg-white p-6 text-center"
      initial={undefined}
      animate={controls}
      transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : index * 0.06 }}
    >
      <Icon size={22} className="mx-auto text-brand-blue" />
      <p className="mt-3 font-display text-3xl font-bold text-brand-blue-dark sm:text-4xl">
        {displayValue.toLocaleString()}
        {stat.suffix ?? ""}
      </p>
      <p className="mt-1 text-sm font-medium text-text-body">
        {stat.label}
        {stat.approx ? (
          <span className="ml-1 text-xs font-normal text-text-muted">(approx.)</span>
        ) : null}
      </p>
      {stat.description ? <p className="mt-1 text-xs text-text-muted">{stat.description}</p> : null}
    </motion.div>
  );
}
