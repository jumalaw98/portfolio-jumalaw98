export type ProjectStatus = "live" | "in-progress";

export interface Project {
  slug: string;
  title: string;
  status: ProjectStatus;
  role: string;
  timeframe: string;
  stack: string[];
  summary: string; // one-line outcome, used on cards/teasers
  featured: boolean;

  // Case study body — six-part structure per portfolio-sitemap.md Section 2a
  problem: string;
  constraints: string;
  decisions: string | string[];
  whatWasBuilt: string | string[];
  outcome: string | string[];
  reflection: string | string[];

  liveUrl?: string;
  screenshots?: string[]; // paths under /public/images/projects/<slug>/
  designCredit?: string; // e.g. "Mercy" — honest attribution per brand-profile honesty boundaries
}
