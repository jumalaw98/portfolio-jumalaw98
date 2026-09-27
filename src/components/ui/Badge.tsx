import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "blue" | "orange" | "neutral";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const TONE_CLASSES: Readonly<Record<Tone, string>> = {
  blue: "bg-brand-blue-tint text-brand-blue-dark",
  orange: "bg-brand-orange-tint text-brand-orange-dark",
  neutral: "bg-zinc-100 text-text-body",
};

/**
 * Map a tone to its classes without indexing the object with a variable.
 *
 * `TONE_CLASSES[tone]` is a dynamic property access on a plain object: an
 * out-of-union value (possible from untyped/JavaScript callers) could resolve a
 * prototype member instead of a class string. An explicit switch can only ever
 * return the strings declared above.
 */
function toneClasses(tone: Tone): string {
  switch (tone) {
    case "blue":
      return TONE_CLASSES.blue;
    case "orange":
      return TONE_CLASSES.orange;
    case "neutral":
      return TONE_CLASSES.neutral;
    default:
      // Unreachable for typed callers; keeps unexpected runtime values on-brand
      // instead of rendering an unstyled badge.
      return TONE_CLASSES.blue;
  }
}

/** Small pill label. Used for stack tags (mono font) and status markers. */
export function Badge({ children, tone = "blue", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs font-medium",
        toneClasses(tone),
        className,
      )}
    >
      {children}
    </span>
  );
}
