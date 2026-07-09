import { Container } from "@/components/ui/Container";
import { ProjectGrid } from "@/components/sections/ProjectGrid";
import { RevealSection } from "@/components/ui/RevealSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { mvpProjects } from "@/content/projects";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Projects — React, Next.js & DevOps Case Studies",
  description:
    "Case studies of production React and Next.js websites and platforms I've built and continue to maintain in Nairobi, Kenya — the real problems, constraints, and decisions behind each one.",
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <Container className="py-16">
      <JsonLd data={breadcrumbJsonLd([{ name: "Projects", path: "/projects" }])} />

      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Projects</h1>
        <p className="mt-4 text-lg text-text-body">
          Each case study below covers ownership and decisions, not just screenshots —
          the problem, the constraints, and why things were built the way they were.
        </p>
      </div>

      {/* Visually hidden — keeps the heading hierarchy valid (h1 → h2 → h3 on
          each card) without changing the page's visual design. */}
      <h2 className="sr-only">All Case Studies</h2>

      <RevealSection className="mt-12">
        <ProjectGrid projects={mvpProjects} />
      </RevealSection>
    </Container>
  );
}
