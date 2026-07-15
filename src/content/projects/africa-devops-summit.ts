import type { Project } from "@/types/project";
import { PROJECT_IMAGES } from "@/lib/project-images";

export const africaDevopsSummit: Project = {
  slug: "africa-devops-summit",
  title: "Africa DevOps Summit Website",
  status: "live",
  role: "Team Lead, Developer & Decision Maker",
  timeframe: "2025–2026, ongoing",
  stack: ["React", "Vite", "Tailwind", "TypeScript", "Github", "Cloudflare", "Figma", "ImageKit"],
  summary:
    "Led the frontend rebuild for a growing 200+ attendee continental conference faster, more accessible, and actively maintained year over year.",
  featured: true,
  designCredit: "Mercy (designer)",

  problem:
    "The old summit site was slow enough that it showed up in how people used it, not just in a dev tool. Updating the schedule or the sponsor list meant going through code that hadn't been touched since the event was a third of its current size. It needed a rebuild, not another patch.",
  constraints:
    "Three people: me leading and building, one designer, one other developer. No deadline and no budget, every tool we used, we already had access to: GitHub, Figma, Cloudflare, ImageKit. No deadline sounds like a low-stakes constraint, but it's the opposite, most side projects without one never ship. Every feature request got the same test: does this make the site faster or more usable, or is it just scope creep? That filter shaped the build from the start rather than getting applied after the fact, nothing made it onto the site without a clear answer to that question.",
  decisions:
    "I built the frontend in React and TypeScript and hosted it on Cloudflare. Mercy designed in Figma; I turned her designs into working pages and handled most of the development myself, with a second developer supporting the build",
  whatWasBuilt:
    "Event images load through ImageKit instead of being served raw, the difference shows up immediately in how fast pages feel, especially on mobile. The schedule and speaker pages were the harder problem: getting the data structure right so both compiled cleanly and stayed easy to update took real iteration, but the result holds up, no more digging through hardcoded HTML to add a speaker or move a session.",
  outcome:
    "The 2025 edition drew 300+ attendees, 10+ speakers, and 10+ partners and sponsors. On the rebuilt site, current Lighthouse scores sit at 96 for accessibility, 100 for best practices, and 100 for SEO on both mobile and desktop, effectively maxed out. Performance is the honest gap, at 66 on mobile and 69 on desktop, and I have a good idea why: too many network requests and JS that isn't compressed. That's the next fix, not a mystery to solve.",
  reflection:
    "The site gets revisited every year instead of shipped once and left alone, the 2026 edition is already in planning. The immediate target is mobile performance: cutting network requests and compressing JS to close the gap between a 66 and something closer to where the rest of the scores already sit.",

  liveUrl: "https://devopssummit.africa/",
  screenshots: [...PROJECT_IMAGES.projects["africa-devops-summit"]],
};
