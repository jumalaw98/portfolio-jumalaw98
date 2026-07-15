import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/types/project";

interface ProjectGridProps {
  readonly projects: readonly Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, i) => (
        <ProjectCard key={project.slug} project={project} index={i} />
      ))}
    </div>
  );
}
