import type { Project } from "@/types/project";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";

export const africaDevopsSummit: Project = {
  slug: "africa-devops-summit",
  title: "Africa DevOps Summit Website",
  status: "live",
  role: "Team Lead, Developer & Decision Maker",
  timeframe: "2025–2026, ongoing",
  stack: ["React", "TypeScript", "Cloudflare", "Figma", "ImageKit"],
  summary:
    "Led the frontend rebuild for a growing 200+ attendee continental conference — faster, more accessible, and actively maintained year over year.",
  featured: true,
  designCredit: "Mercy (designer)",

  problem:
    "The old summit site was slow, and updating things like the schedule or sponsor list meant digging through code that hadn't kept up with how fast the event was growing. It needed a real rebuild, not a patch job.",
  constraints:
    "Small team: me leading and building, plus one designer and one other developer. No deadline, no budget — everything ran on tools we already had access to, mainly GitHub, Figma, Cloudflare, and ImageKit.",
  decisions:
    "I built it in React and TypeScript and hosted it on Cloudflare, with Mercy handling design in Figma. Whenever a feature request came up, the question was simple: does this make the site faster or more usable, or is it just extra scope? A few ideas got cut because they didn't clear that bar.",
  whatWasBuilt:
    "I owned the frontend build, the project management, and most of the technical calls, working from Mercy's designs. Nothing on the site got the leftover-afterthought treatment — the schedule, speaker pages, sponsor and partner listings were all built as real features, not filler.",
  outcome:
    "The 2025 edition pulled 200+ attendees, 10+ speakers, and 10+ partners and sponsors. SEO and accessibility scores both improved measurably after the rebuild.",
  reflection:
    "This one's still growing. It gets revisited and improved every year rather than shipped once and forgotten, and the 2026 edition is already being planned.",

  liveUrl: "https://devopssummit.africa/",
  screenshots: [...PLACEHOLDER_IMAGES.projects["africa-devops-summit"]], // TODO: replace with real screenshots
};
