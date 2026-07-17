"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const baseClass =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const inactiveClass =
    "bg-brand-blue-tint text-brand-blue-dark hover:bg-brand-blue-light hover:text-white";
  const activeClass = "bg-brand-blue text-white";

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Blog pagination">
      <button
        type="button"
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(baseClass, inactiveClass)}
        aria-label="Previous page"
      >
        Prev
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => goTo(p)}
          aria-current={p === currentPage ? "page" : undefined}
          className={cn(baseClass, p === currentPage ? activeClass : inactiveClass)}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(baseClass, inactiveClass)}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}
