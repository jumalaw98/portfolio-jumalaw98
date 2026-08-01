"use client";

import { useEffect } from "react";
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
  const shouldReduceMotion = useReducedMotion() ?? false;
  const controls = useAnimationControls();

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
    controls.start({ opacity: 1, y: 0 });
  }, [shouldReduceMotion, controls]);

  return (
    <motion.div
      className="flex h-full flex-col justify-between rounded-lg border border-border bg-white p-6"
      initial={undefined}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      animate={controls}
      viewport={shouldReduceMotion ? undefined : { once: true, margin: "-50px" }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.4, delay: index * 0.06, ease: "easeOut" }
      }
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
              boxShadow:
                "0 12px 24px -8px rgba(28, 118, 181, 0.18), 0 0 0 1px rgba(28, 118, 181, 0.25)",
            }
      }
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
