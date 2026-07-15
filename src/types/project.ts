export type ProjectStatus = "live" | "in-progress";

export interface Project {
  slug: string;
  title: string;
  status: ProjectStatus;
  role: string;
  timeframe: string;
  stack: string[];
  summary: string;
  featured: boolean;

  problem: string;
  constraints: string;
  decisions: string | string[];
  whatWasBuilt: string | string[];
  outcome: string | string[];
  reflection: string | string[];

  liveUrl?: string;
  screenshots?: string[];
  designCredit?: string;
}
