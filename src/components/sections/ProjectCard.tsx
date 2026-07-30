"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  readonly project: Project;
  readonly index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimationControls();
  const [mounted, setMounted] = useState(false);
  const animDoneRef = useRef(false);

  // Mount flag: SSR renders with no hidden styles, then client enables
  // the entrance animation after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // After mount, kick off the entrance animation from hidden → visible.
  // Using animate controls (not whileInView) so we can start from the
  // hidden state that was set after mount, giving a proper staggered
  // entrance while keeping SSR content visible.
  useEffect(() => {
    if (!mounted || shouldReduceMotion) return;
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: index * 0.06 },
    });
  }, [mounted, shouldReduceMotion, controls, index]);

  // Safety timeout: if the scroll observer never fires, force reveal.
  // Guarded by animDoneRef so it's a no-op when the animation already completed.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animDoneRef.current) return;
      controls.start({ opacity: 1, y: 0 });
    }, 3000);
    return () => clearTimeout(timer);
  }, [controls]);

  return (
    <motion.div
      className="flex h-full flex-col justify-between rounded-lg border border-border bg-white p-6"
      initial={mounted && !shouldReduceMotion ? { opacity: 0, y: 16 } : false}
      animate={controls}
      onAnimationComplete={() => {
        animDoneRef.current = true;
      }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
              boxShadow:
                "0 12px 24px -8px rgba(28, 118, 181, 0.18), 0 0 0 1px rgba(28, 118, 181, 0.25)",
            }
      }
      suppressHydrationWarning
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold text-brand-ink">{project.title}</h3>
          {project.status === "in-progress" ? <Badge tone="orange">In Progress</Badge> : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <Badge key={tech} tone="blue">
              {tech}
            </Badge>
          ))}
        </div>

        <p className="mt-4 text-sm text-text-body">{project.summary}</p>
      </div>

      <Link
        href={`/projects/${project.slug}`}
        className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-blue-dark"
      >
        Read Case Study
        <ArrowRight
          size={16}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </Link>
    </motion.div>
  );
}
