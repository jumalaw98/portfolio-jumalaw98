function shimmer(className: string) {
  return <div className={`animate-pulse rounded bg-brand-blue-tint ${className}`} />;
}

export function BlogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {shimmer("aspect-video w-full rounded-none")}
      <div className="flex flex-col gap-3 p-5">
        {shimmer("h-4 w-1/3")}
        {shimmer("h-5 w-full")}
        {shimmer("h-4 w-full")}
        {shimmer("h-4 w-2/3")}
      </div>
    </div>
  );
}

export function BlogGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FeaturedPostSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid md:grid-cols-2">
        {shimmer("aspect-video w-full rounded-none")}
        <div className="flex flex-col gap-4 p-8">
          {shimmer("h-5 w-20")}
          {shimmer("h-8 w-full")}
          {shimmer("h-4 w-full")}
          {shimmer("h-4 w-2/3")}
        </div>
      </div>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {shimmer("h-4 w-32")}
      {shimmer("h-10 w-full")}
      {shimmer("h-4 w-1/2")}
      {shimmer("aspect-video w-full")}
      <div className="mt-4 flex flex-col gap-3">
        {shimmer("h-4 w-full")}
        {shimmer("h-4 w-full")}
        {shimmer("h-4 w-3/4")}
      </div>
    </div>
  );
}
