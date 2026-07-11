import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { BlogPost } from "@/types/blogPost";
import { formatBlogDate, formatReadTime } from "./blogFormat";

interface FeaturedPostProps {
  post: BlogPost;
}

export function FeaturedPost({ post }: FeaturedPostProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-xl border border-border"
    >
      <div className="grid md:grid-cols-2">
        {post.coverImageUrl ? (
          <div className="relative aspect-video md:aspect-auto">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="flex flex-col justify-center p-8">
          <Badge tone="orange" className="w-fit">
            Latest
          </Badge>
          <h2 className="mt-4 text-2xl font-bold leading-snug text-brand-ink group-hover:text-brand-blue sm:text-3xl">
            {post.title}
          </h2>
          {post.subtitle ? <p className="mt-2 text-text-muted">{post.subtitle}</p> : null}
          <p className="mt-3 text-text-body">{post.brief}</p>

          <div className="mt-5 flex items-center gap-4 text-sm text-text-muted">
            <span>{formatBlogDate(post.publishedAt)}</span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {formatReadTime(post.readTimeInMinutes)}
            </span>
          </div>

          <span className="mt-6 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-blue">
            Read article
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
