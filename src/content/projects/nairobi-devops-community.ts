import type { Project } from "@/types/project";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";

export const nairobiDevopsCommunity: Project = {
  slug: "nairobi-devops-community",
  title: "Nairobi DevOps Community Rebuild",
  status: "live",
  role: "Team Lead, Developer & Decision Maker",
  timeframe: "2025–2026, ongoing",
  stack: ["React", "TypeScript", "PHP", "cPanel", "Luma", "Substack"],
  summary:
    "Rebuilt a static community site into a dynamic platform with live event integration and newsletter capture.",
  featured: true,

  problem:
    "The old site was static. Content went stale fast, and there was no way for it to show upcoming events without someone manually editing a page every time.",
  constraints:
    "Just me and one designer. No deadline, no budget pressure — which gave us room to actually think through the rebuild instead of rushing it.",
  decisions:
    "I rebuilt it in React and TypeScript on cPanel with a PHP backend, then wired in Luma so upcoming events pull in automatically instead of needing manual updates. I also added a Substack signup form for the newsletter rather than building a custom subscriber system from scratch — no reason to reinvent that part.",
  whatWasBuilt:
    "A full rebuild: content, live event integration, and newsletter capture, with every section built as a real feature rather than something bolted on at the end.",
  outcome:
    "Google Analytics shows traffic climbed noticeably after the rebuild. I haven't set up formal tracking for membership or signup growth yet, so I can't put a number on those — that's the honest state of it right now.",
  reflection:
    "Still refining it post-launch. Getting real tracking in place for membership and signups is the obvious next step.",

  liveUrl: "https://nairobidevops.org/",
  screenshots: [...PLACEHOLDER_IMAGES.projects["nairobi-devops-community"]], // TODO: replace with real screenshots
};
