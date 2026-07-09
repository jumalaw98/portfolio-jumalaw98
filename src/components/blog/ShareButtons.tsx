"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { TwitterIcon, LinkedinIcon } from "@/components/ui/BrandIcons";

interface ShareButtonsProps {
  title: string;
  url: string; // absolute URL of the article page on this site
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      label: "Share on X",
      Icon: TwitterIcon,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "Share on LinkedIn",
      Icon: LinkedinIcon,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently ignore, link buttons still work.
    }
  }

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
        aria-label={copied ? "Link copied" : "Copy link"}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-body transition-colors hover:border-brand-blue hover:text-brand-blue"
      >
        {copied ? <Check size={16} /> : <Link2 size={16} />}
      </button>
    </div>
  );
}
