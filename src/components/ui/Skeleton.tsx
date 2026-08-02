interface SkeletonProps {
  className?: string;
  /**
   * Show subtle shimmer animation. Disabled by default so callers opt in;
   * when visible, the global `prefers-reduced-motion` rule kills the
   * animation and leaves a static placeholder.
   */
  shimmer?: boolean;
}

/**
 * Minimal skeleton placeholder block. Use as a loading placeholder in
 * sections where content renders after a brief delay (entrance animation,
 * image load, etc.).
 *
 * Each block is `aria-hidden` — the outer container should use `role="status"`
 * or `aria-busy` so screen readers announce the loading state.
 */
export function Skeleton({ className = "", shimmer = false }: Readonly<SkeletonProps>) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-lg bg-zinc-200 ${className}`}
      aria-hidden="true"
    >
      {shimmer ? (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      ) : null}
    </div>
  );
}
