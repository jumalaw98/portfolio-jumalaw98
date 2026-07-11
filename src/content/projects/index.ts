import type { Project } from "@/types/project";
import { africaDevopsSummit } from "./africa-devops-summit";
import { nairobiDevopsCommunity } from "./nairobi-devops-community";
import { pretalxAzure } from "./pretalx-azure";
import { kommunitiAfrica } from "./kommuniti-africa";

// Ordered by strategic priority per portfolio-sitemap.md Section 2.
// kommuniti-africa is included but status "in-progress" — filter it out
// of the MVP grid at render time (see ProjectGrid.tsx) until V2.
export const allProjects: Project[] = [
  africaDevopsSummit,
  nairobiDevopsCommunity,
  pretalxAzure,
  kommunitiAfrica,
];

export const mvpProjects: Project[] = allProjects.filter((p) => p.status === "live");

export function getProjectBySlug(slug: string): Project | undefined {
  return allProjects.find((p) => p.slug === slug);
}
