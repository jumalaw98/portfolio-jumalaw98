import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-white p-6 transition-shadow duration-150 hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}
