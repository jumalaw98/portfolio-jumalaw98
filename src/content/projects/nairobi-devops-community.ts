import type { Project } from "@/types/project";
import { PROJECT_IMAGES } from "@/lib/project-images";

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
    "The old site was static. Every new event meant someone manually editing a page, and when nobody had time for that, the site just went stale. For a community that runs 50+ events and works with 20+ partners, an outdated homepage was actively working against membership growth, not just looking dated",
  constraints:
    "Two people: me and one designer, Mercy. No deadline, no budget pressure. That absence of pressure was itself a decision-shaping constraint, it meant I could take the time to actually think through the architecture instead of shipping the fastest possible fix.",
  decisions: [
    "Frontend: Rebuilt in React and TypeScript, replacing the static HTML entirely. Every section, events, membership, partners, newsletter, was built as its own real feature rather than bolted on at the end.\n\n",
    "Live events, without an API integration: Instead of building against Luma's authenticated API (credentials, rate limits, another thing to maintain), I pull events from the account's public ICS calendar feed and parse it on the PHP backend. The homepage always reflects what's actually on the calendar, with zero manual page edits and no API key to rotate or secure.\n\n",
    "Newsletter buy, don't build: Added a Substack signup form instead of a custom subscriber system. Substack already solves delivery, list management, and unsubscribes properly; writing that from scratch would have been weeks of work duplicating a solved problem for no real gain to the community.\n\n",
    "Hosting: Kept it on cPanel with a PHP backend rather than migrating to a new host, the community had zero legacy debt to justify a bigger infrastructure jump. This stayed proportional to the actual problem.\n\n",
    "Jobs board: Built a page that surfaces relevant roles for the community, pulled from general tech job boards like RemoteOK and WeWorkRemotely. Each platform gets fetched differently on the PHP backend, the method depends on what that source actually supports, rather than forcing every source through the same integration pattern. Relevance is a keyword match against DevOps-adjacent roles (SRE, cloud, platform, infra), and I added a recruiter-facing submission form so companies can post open roles directly instead of the board relying only on scraped listings.\n\n",
  ],
  whatWasBuilt:
    "A full rebuild covering content, live event sync via the ICS feed, a curated jobs board, and newsletter capture, serving a community of 4,000+ members across 50+ events and 20+ partner organizations.",
  outcome: [
    "Performance snapshot (May 23–June 19, 2026): active users hit 197, up 47.01%; new users hit 183, up 38.64%; and tracked events reached 991, up 37.45%. Average engagement time came in at 24 seconds, down 32.69%.\n\n",
    "Traffic and new-user growth both moved in a strong direction post-rebuild. The one number that doesn't fit the clean-win narrative is engagement time, which dropped by a third even as more people arrived. I haven't dug into why yet, it could be the events page doing its job well (people check the date and leave, which is a good outcome for that specific page), or it could be a real friction point elsewhere on the site. That's an open question, not a resolved one.\n\n",
    "I also haven't set up conversion tracking for membership sign-ups or newsletter subscribers yet, so I can't attach a number to community growth specifically only to overall site traffic.\n\n",
  ],
  reflection: [
    "Add conversion tracking for membership applications and Substack sign-ups, so the next version of this case study has real funnel numbers instead of just traffic numbers.\n\n",
  ],

  liveUrl: "https://nairobidevops.org/",
  screenshots: [...PROJECT_IMAGES.projects["nairobi-devops-community"]],
};
