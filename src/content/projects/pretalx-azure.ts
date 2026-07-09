import type { Project } from "@/types/project";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";

export const pretalxAzure: Project = {
  slug: "pretalx-azure",
  title: "Pretalx / Azure CFP Deployment",
  status: "live",
  role: "Solo project",
  timeframe: "2026",
  stack: ["Pretalx", "Docker", "Azure", "PostgreSQL", "Redis", "Nginx"],
  summary:
    "Migrated a conference's call-for-papers process off paid third-party platforms onto a self-hosted, cost-efficient deployment.",
  featured: true,

  problem:
    "The conference had been running its call-for-papers through Papercall and Sessionize. Both work fine, but neither gives you control over your own workflow or timeline — you're renting someone else's process, fees included.",
  constraints:
    "Solo build. Server cost was really the only constraint, and even that mostly disappeared since the community already had Azure credits sitting unused.",
  decisions:
    "Pretalx won out because it meant owning the CFP process outright instead of renting it. Azure was the easy call too, since those existing credits meant no new spend. Stack underneath: Docker, PostgreSQL, Redis, and Nginx.",
  whatWasBuilt:
    "A self-hosted CFP platform running the full submission-to-schedule pipeline, with SSL/TLS, locked-down server access, and standard security hardening. I'm keeping the specifics vague here on purpose — this thing handles real speaker and event data, and detailing the setup publicly doesn't seem worth the risk.",
  outcome:
    "No more recurring platform fees, since it now runs on infrastructure the community already had. It's held up reliably since launch and handles the CFP process start to finish.",
  reflection:
    "Monitoring is the next thing I want to tighten up, along with cutting down whatever manual steps are still left in the deployment.",

  liveUrl: "https://talks.nairobidevops.org/",
  screenshots: [...PLACEHOLDER_IMAGES.projects["pretalx-azure"]], // TODO: replace with real screenshots
};
