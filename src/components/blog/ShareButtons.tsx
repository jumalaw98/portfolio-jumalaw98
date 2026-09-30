"use client";

import { useState } from "react";
import { Link2, Check, TriangleAlert } from "lucide-react";
import { TwitterIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { reportClientFailure } from "@/lib/client-errors";

interface ShareButtonsProps {
  title: string;
  url: string; // absolute URL of the article page on this site
  shortUrl?: string; // optional shortened URL (e.g. /s/abc123) for sharing
}

/** How long the copy feedback (success or failure) stays announced. */
const COPY_FEEDBACK_MS = 2000;

type CopyState = "idle" | "copied" | "failed";

export function ShareButtons({ title, url, shortUrl }: ShareButtonsProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  /** Use short URL for social sharing when available, fall back to canonical URL. */
  const shareUrl = shortUrl || url;

  const shareLinks = [
    {
      label: "Share on X",
      Icon: TwitterIcon,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: "Share on LinkedIn",
      Icon: LinkedinIcon,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  function scheduleReset() {
    window.setTimeout(() => setCopyState("idle"), COPY_FEEDBACK_MS);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
    } catch (error) {
      // Clipboard writes legitimately fail: the API is unavailable on insecure
      // origins and in older browsers, and the user may deny the permission.
      // That is an expected operational failure, so it is reported as a
      // recoverable state instead of a silent no-op. The rejection is bound and
      // classified here (never re-thrown, never rendered) so no raw browser
      // exception reaches the UI and no unhandled rejection can escape.
      reportClientFailure("share.copy", error);
      setCopyState("failed");
    } finally {
      scheduleReset();
    }
  }

  const copied = copyState === "copied";
  const failed = copyState === "failed";
  const copyLabel = copied ? "Link copied" : failed ? "Copy failed" : "Copy link";

  return (
    <div className="flex items-center gap-3" aria-label="Share this article">
      {shareLinks.map(({ label, Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-body transition-colors hover:border-brand-blue hover:text-brand-blue"
        >
          <Icon width={16} height={16} />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label={copyLabel}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          failed
            ? "border-red-400 text-red-600"
            : "border-border text-text-body hover:border-brand-blue hover:text-brand-blue"
        }`}
      >
        {copied ? <Check size={16} /> : failed ? <TriangleAlert size={16} /> : <Link2 size={16} />}
      </button>
      {/* Screen-reader feedback for both outcomes, including the recovery hint
          on failure — the social links above stay usable either way. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard." : null}
        {failed ? "Couldn't copy automatically. Copy the address from your browser instead." : null}
      </span>
    </div>
  );
}

