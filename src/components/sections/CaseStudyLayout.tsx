import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RevealSection } from "@/components/ui/RevealSection";
import type { Project } from "@/types/project";

interface CaseStudyLayoutProps {
  readonly project: Project;
  readonly nextProject?: Project;
}

const sections: { heading: string; field: keyof Project }[] = [
  { heading: "Problem", field: "problem" },
  { heading: "Constraints", field: "constraints" },
  { heading: "Decisions", field: "decisions" },
  { heading: "What Was Built", field: "whatWasBuilt" },
  { heading: "Outcome", field: "outcome" },
  { heading: "What's Next / Reflection", field: "reflection" },
];

export function CaseStudyLayout({ project, nextProject }: CaseStudyLayoutProps) {
  return (
    <article>
      {/* Header */}
      <header className="border-b border-border bg-brand-blue-tint py-16">
        <Container>
          <p className="font-mono text-sm text-brand-blue-dark">
            {project.role} · {project.timeframe}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{project.title}</h1>
          {project.designCredit ? (
            <p className="mt-3 text-sm text-text-muted">Design: {project.designCredit}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <Badge key={tech} tone="blue">
                {tech}
              </Badge>
            ))}
          </div>
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-blue-dark"
            >
              Visit live site
              <ExternalLink size={16} />
            </a>
          ) : null}
        </Container>
      </header>

      {/* Screenshot gallery — placeholder images until real screenshots are dropped in */}
      {project.screenshots && project.screenshots.length > 0 ? (
        <Container className="py-10">
          <div className="grid gap-4 sm:grid-cols-2">
            {project.screenshots.map((src, i) => (
              <div
                key={src + i}
                className="relative aspect-video overflow-hidden rounded-lg border border-border bg-brand-blue-tint"
              >
                <Image
                  src={src}
                  alt={`${project.title} screenshot ${i + 1}`}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </Container>
      ) : null}

      {/* Body */}
      <Container className="max-w-3xl py-16">
        <div className="flex flex-col gap-12">
          {sections.map(({ heading, field }, i) => (
            <RevealSection key={field} delay={i * 0.05}>
              <section>
                <h2 className="text-xl font-semibold text-brand-ink">{heading}</h2>
                {/* <p className="mt-3 text-base leading-relaxed text-text-body">
                  {project[field] as string}
                </p> */}
                <div className="mt-3 space-y-4 text-base leading-relaxed text-text-body">
                  {(() => {
                    const raw = project[field];
                    if (!raw) return null;
                    const paragraphs: string[] =
                      typeof raw === "string" ? raw.split("\n\n") : (raw as string[]);
                    return paragraphs.map((para, i) => (
                      <p key={`${field}-${i}`}>{para}</p>
                    ));
                  })()}
                </div>
              </section>
            </RevealSection>
          ))}
        </div>
      </Container>

      {/* Footer CTA */}
      <RevealSection>
        <Container className="flex flex-col items-start gap-6 border-t border-border py-12 sm:flex-row sm:items-center sm:justify-between">
          {nextProject ? (
            <Link
              href={`/projects/${nextProject.slug}`}
              className="text-sm font-semibold text-brand-blue hover:text-brand-blue-dark"
            >
              Next case study: {nextProject.title} →
            </Link>
          ) : (
            <Link
              href="/projects"
              className="text-sm font-semibold text-brand-blue hover:text-brand-blue-dark"
            >
              ← Back to all projects
            </Link>
          )}
          <Button href="/contact" variant="primary">
            Get In Touch
          </Button>
        </Container>
      </RevealSection>
    </article>
  );
}
