import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Skeleton placeholder matching the CredibilityStrip stats layout.
 * Renders 4 shimmer blocks in the same 2×2 / 4-col grid as the real
 * stat tiles, on a matching brand-blue-dark background.
 *
 * Intended as the `skeleton` prop of RevealSection.
 */
export function CredibilityStripSkeleton() {
  return (
    <section className="border-y border-border bg-brand-blue-dark py-12">
      <Container>
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              {/* Stat value placeholder */}
              <Skeleton className="h-8 w-24 rounded" shimmer />
              {/* Stat label placeholder */}
              <Skeleton className="h-4 w-28 rounded" shimmer />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
