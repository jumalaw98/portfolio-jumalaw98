"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex h-full flex-col justify-between rounded-lg border border-border bg-white p-6"
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : index * 0.06 }}
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
          {project.status === "in-progress" ? (
            <Badge tone="orange">In Progress</Badge>
          ) : null}
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
        <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
