"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { STACK_HIGHLIGHTS } from "@/lib/constants";
import {
  ReactIcon,
  NextjsIcon,
  TypeScriptIcon,
  TailwindIcon,
  DockerIcon,
  AzureIcon,
  CloudflareIcon,
  GithubActionsIcon,
} from "@/components/ui/BrandIcons";

interface TechDetail {
  readonly Icon: React.ComponentType<{ readonly className?: string }>;
  readonly colorClass: string;
  readonly hoverGlow: string;
}

const TECH_DETAILS: Record<string, TechDetail> = {
  React: {
    Icon: ReactIcon,
    colorClass: "hover:text-[#61dafb] hover:scale-110",
    hoverGlow: "rgba(97, 218, 251, 0.15)",
  },
  "Next.js": {
    Icon: NextjsIcon,
    colorClass: "hover:text-brand-blue-dark hover:scale-110 dark:hover:text-white",
    hoverGlow: "rgba(28, 118, 181, 0.15)",
  },
  TypeScript: {
    Icon: TypeScriptIcon,
    colorClass: "hover:text-[#3178c6] hover:scale-110",
    hoverGlow: "rgba(49, 120, 198, 0.15)",
  },
  Tailwind: {
    Icon: TailwindIcon,
    colorClass: "hover:text-[#38bdf8] hover:scale-110",
    hoverGlow: "rgba(56, 189, 248, 0.15)",
  },
  Docker: {
    Icon: DockerIcon,
    colorClass: "hover:text-[#2496ed] hover:scale-110",
    hoverGlow: "rgba(36, 150, 237, 0.15)",
  },
  Azure: {
    Icon: AzureIcon,
    colorClass: "hover:text-[#0078d4] hover:scale-110",
    hoverGlow: "rgba(0, 120, 212, 0.15)",
  },
  Cloudflare: {
    Icon: CloudflareIcon,
    colorClass: "hover:text-[#f38020] hover:scale-110",
    hoverGlow: "rgba(243, 128, 32, 0.15)",
  },
  "GitHub Actions": {
    Icon: GithubActionsIcon,
    colorClass: "hover:text-[#2088ff] hover:scale-110",
    hoverGlow: "rgba(32, 136, 255, 0.15)",
  },
};

export function StackHighlights() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-14">
      <Container>
        <p className="text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          Core Stack
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          {STACK_HIGHLIGHTS.map((tech, index) => {
            const details = TECH_DETAILS[tech];
            if (!details) return null;
            const { Icon, colorClass, hoverGlow } = details;

            return (
              <div
                key={tech}
                className="relative flex flex-col items-center"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="pointer-events-none absolute -top-12 z-10 whitespace-nowrap rounded-lg bg-brand-slate px-3 py-1.5 text-xs font-mono font-medium text-white shadow-lg"
                      style={{
                        boxShadow: `0 4px 20px ${hoverGlow}`,
                      }}
                    >
                      {tech}
                      <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-brand-slate" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div
                  className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-white border border-border text-text-muted transition-all duration-300 shadow-sm ${colorClass}`}
                  style={{
                    boxShadow: hoveredIndex === index ? `0 8px 30px ${hoverGlow}` : undefined,
                    borderColor: hoveredIndex === index ? "transparent" : undefined,
                  }}
                >
                  <Icon className="h-7 w-7" />
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

