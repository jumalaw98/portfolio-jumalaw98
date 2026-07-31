"use client";

import { useMemo } from "react";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

interface ProjectGridSkeletonProps {
  /** Number of skeleton cards to render. Should match the live project count. */
  readonly count?: number;
}

/**
 * Skeleton placeholder matching the Featured Projects section layout
 * (heading + grid). Overlay as the `skeleton` prop of RevealSection.
 *
 * - The outer wrapper mirrors the real section's padding and container.
 * - The heading row and card grid have the same dimensions as real content,
 *   so the overlay covers everything needed during the fade-in transition.
 * - Accepts a `count` prop so the skeleton card count matches the live
 *   project count, preventing blank areas during the reveal.
 */
export function ProjectGridSkeleton({ count = 5 }: ProjectGridSkeletonProps) {
  const skeletonIds = useMemo(
    () => Array.from({ length: count }, () => crypto.randomUUID()),
    [count],
  );

  return (
    <section className="py-20">
      <Container>
        {/* Heading row: title + ghost button */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Skeleton className="h-9 w-64 rounded" shimmer />
          <Skeleton className="h-10 w-36 rounded-md" shimmer />
        </div>

        {/* Card grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonIds.map((id) => (
            <div
              key={id}
              className="flex h-full flex-col justify-between rounded-lg border border-border bg-white p-6"
            >
              <div>
                {/* Title */}
                <Skeleton className="mb-2 h-6 w-3/4" shimmer />
                {/* Badge pills */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" shimmer />
                  <Skeleton className="h-5 w-20 rounded-full" shimmer />
                  <Skeleton className="h-5 w-14 rounded-full" shimmer />
                </div>
                {/* Text lines */}
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full" shimmer />
                  <Skeleton className="h-4 w-5/6" shimmer />
                </div>
              </div>
              {/* Link */}
              <div className="mt-6">
                <Skeleton className="h-4 w-32" shimmer />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
