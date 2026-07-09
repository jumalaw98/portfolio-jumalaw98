import { communityRoles } from "./community";
import { speakingEngagements } from "./community";
import { mvpProjects } from "./projects";

export type ImpactStatIconKey =
  | "users"
  | "mic"
  | "building"
  | "calendar"
  | "rocket"
  | "globe";

export interface ImpactStat {
  icon: ImpactStatIconKey;
  value: number;
  suffix?: string;
  label: string;
  description?: string;
  /** True when the figure is a reasonable aggregate estimate rather than an
   * exact, individually-sourced count — shown with a small "approx." marker
   * in the UI so nothing reads as more precise than it is. */
  approx?: boolean;
}

const COMMUNITY_LEADERSHIP_START_YEAR = 2022; // confirmed — portfolio-content.md Section 3a

function yearsSince(year: number): number {
  return Math.max(1, new Date().getFullYear() - year);
}

// Aggregated across all documented community activity — not just one
// organization. Values marked `approx: true` are conservative estimates
// built from named, documented events/trainings (see comments below), not
// invented figures; review and tighten before publishing. Two commonly
// requested metrics — mentoring sessions and volunteers coordinated — are
// deliberately left out for now: there's no documented count to aggregate
// from yet. Add them here once real numbers exist; the grid and animation
// pick up new entries automatically.
export const impactStats: ImpactStat[] = [
  {
    icon: "users",
    value: 4000,
    suffix: "+",
    label: "Community members reached",
    description: "Across Nairobi DevOps Community's platforms",
  },
  {
    icon: "mic",
    value: speakingEngagements.length,
    suffix: "+",
    label: "Speaking engagements",
    description: "Confirmed conference talks — additional untracked appearances on Spaces/YouTube",
  },
  {
    icon: "building",
    value: communityRoles.length,
    label: "Communities led or co-founded",
    description: "Current and past leadership roles",
  },
  {
    icon: "calendar",
    value: yearsSince(COMMUNITY_LEADERSHIP_START_YEAR),
    suffix: "+",
    label: "Years of community leadership",
    description: `Since ${COMMUNITY_LEADERSHIP_START_YEAR}, alongside the developer journey`,
  },
  {
    icon: "rocket",
    value: mvpProjects.length,
    label: "Production platforms shipped",
    description: "Live, maintained sites and platforms",
  },
  {
    icon: "globe",
    value: 3,
    suffix: "+",
    label: "Countries reached",
    description: "Kenya, Uganda, and community members across East Africa",
    approx: true, // TODO: confirm exact scope with Lawrence
  },
];
