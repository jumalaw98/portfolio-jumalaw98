import type { Project } from "@/types/project";
import { PROJECT_IMAGES } from "@/lib/project-images";

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
    "Nairobi DevOps Community was running its call-for-papers through paid third-party platforms, which handled submissions fine but left the community with no control over its own data or workflow, plus recurring fees for something that could run on infrastructure it already had.",
  constraints:
    "Solo build, no dedicated budget. The community had unused Azure credits sitting idle, which turned 'server cost' from a real constraint into a non-issue",
  decisions:
    "Pretalx won out because it meant owning the CFP process outright instead of renting it. Azure was the obvious host given the existing credits. Underneath: Docker Compose, PostgreSQL, Redis, and Nginx, with Azure Key Vault and Managed Identity handling secrets so nothing sensitive lives in a config file or git history",
  whatWasBuilt: [
    "A production CFP platform covering the full pipeline from submission to review to schedule publishing, at talks.nairobidevops.org. Highlights:",
    "Multi-stage Docker build that cut the application image from 1.64 GB to 402 MB and eliminated two critical CVEs in the process.",
    "HTTPS via Let's Encrypt with auto-renewal, NSG-restricted SSH, and a CI/CD pipeline (GitHub Actions) requiring a second human approval before anything reaches production.",
    "Automated daily backups to Azure Blob Storage, with a tested restore procedure, the last drill brought the database back in 29 seconds, and the entire platform back online in 2 minutes 15 seconds.",
    "Custom email integration built directly against the Azure Communication Services REST API after the standard SMTP path turned out to be blocked at the tenant level, not a workaround, a proper Django backend now running in production",
  ],
  outcome:
    "No more recurring platform fees, since it now runs on infrastructure the community already had. It's held up reliably since launch and handles the CFP process start to finish.",
  reflection:
    "Tightening monitoring, container-level log shipping to Azure Monitor is in place, but the alerting still needs a pass before the review period starts. Also trimming the deployment steps that are still manual, ahead of the first real production release under load.",

  liveUrl: "https://talks.nairobidevops.org/",
  screenshots: [...PROJECT_IMAGES.projects["pretalx-azure"]],
};
