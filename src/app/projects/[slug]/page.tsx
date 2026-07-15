import { notFound } from "next/navigation";
import { CaseStudyLayout } from "@/components/sections/CaseStudyLayout";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProjectBySlug, mvpProjects } from "@/content/projects";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";

interface CaseStudyPageProps {
  readonly params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return mvpProjects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return pageMetadata({
      title: "Project not found",
      description: "This case study doesn't exist.",
      path: `/projects/${slug}`,
      index: false,
    });
  }

  return pageMetadata({
    title: project.title,
    description: project.summary,
    path: `/projects/${project.slug}`,
    ogImage: project.screenshots?.[0],
  });
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (project?.status !== "live") {
    notFound();
  }

  const currentIndex = mvpProjects.findIndex((p) => p.slug === slug);
  const nextProject = mvpProjects[(currentIndex + 1) % mvpProjects.length];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Projects", path: "/projects" },
          { name: project.title, path: `/projects/${project.slug}` },
        ])}
      />
      <CaseStudyLayout
        project={project}
        nextProject={nextProject.slug !== project.slug ? nextProject : undefined}
      />
    </>
  );
}
