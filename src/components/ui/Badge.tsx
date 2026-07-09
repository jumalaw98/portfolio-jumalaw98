import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  tone?: "blue" | "orange" | "neutral";
  className?: string;
}

const toneClasses = {
  blue: "bg-brand-blue-tint text-brand-blue-dark",
  orange: "bg-brand-orange-tint text-brand-orange-dark",
  neutral: "bg-zinc-100 text-text-body",
};

/** Small pill label. Used for stack tags (mono font) and status markers. */
export function Badge({ children, tone = "blue", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
