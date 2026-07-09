"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  tags: { name: string; slug: string }[];
}

export function TagFilter({ tags }: TagFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  function setTag(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("tag", slug);
    } else {
      params.delete("tag");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts by tag">
      <button
        type="button"
        onClick={() => setTag(null)}
        aria-pressed={!activeTag}
        className={cn(
          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          !activeTag
            ? "bg-brand-blue text-white"
            : "bg-brand-blue-tint text-brand-blue-dark hover:bg-brand-blue-light hover:text-white",
        )}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag.slug}
          type="button"
          onClick={() => setTag(tag.slug)}
          aria-pressed={activeTag === tag.slug}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            activeTag === tag.slug
              ? "bg-brand-blue text-white"
              : "bg-brand-blue-tint text-brand-blue-dark hover:bg-brand-blue-light hover:text-white",
          )}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
