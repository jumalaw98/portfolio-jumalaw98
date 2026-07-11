"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import type { BlogPost } from "@/types/blogPost";
import { formatBlogDate, formatReadTime } from "./blogFormat";

interface BlogCardProps {
  post: BlogPost;
  priority?: boolean;
  index?: number;
}

export function BlogCard({ post, priority = false, index = 0 }: BlogCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Intentionally set after mount to avoid hydration mismatches with
    // framer-motion's `initial` prop — the component server-renders with
    // no animation state, then enables entrance animations on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <motion.div
      className="h-full"
      initial={mounted && !shouldReduceMotion ? { opacity: 0, y: 16 } : undefined}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : index * 0.06 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
              boxShadow:
                "0 12px 24px -8px rgba(28, 118, 181, 0.18), 0 0 0 1px rgba(28, 118, 181, 0.25)",
            }
      }
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group block h-full overflow-hidden rounded-lg border border-border bg-white"
      >
        {post.coverImageUrl ? (
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col p-5">
          {post.tags.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {post.tags.slice(0, 2).map((tag) => (
                <Badge key={tag.slug} tone="blue">
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : null}

          <h3 className="text-lg font-semibold leading-snug text-brand-ink">{post.title}</h3>
          {post.subtitle ? <p className="mt-1 text-sm text-text-muted">{post.subtitle}</p> : null}
          <p className="mt-2 flex-1 text-sm text-text-body">{post.brief}</p>

          <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
            <span>{formatBlogDate(post.publishedAt)}</span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {formatReadTime(post.readTimeInMinutes)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
