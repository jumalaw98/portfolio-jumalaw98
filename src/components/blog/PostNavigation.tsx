import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { BlogPost } from "@/types/blogPost";

interface PostNavigationProps {
  previous: BlogPost | null;
  next: BlogPost | null;
}

export function PostNavigation({ previous, next }: PostNavigationProps) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="More articles"
      className="grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={`/blog/${previous.slug}`}
          className="group flex flex-col rounded-lg border border-border p-4 hover:border-brand-blue"
        >
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <ArrowLeft size={14} />
            Previous
          </span>
          <span className="mt-1 font-medium text-brand-ink group-hover:text-brand-blue">
            {previous.title}
          </span>
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group flex flex-col rounded-lg border border-border p-4 text-right hover:border-brand-blue sm:items-end"
        >
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            Next
            <ArrowRight size={14} />
          </span>
          <span className="mt-1 font-medium text-brand-ink group-hover:text-brand-blue">
            {next.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
