import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Hero } from "@/components/sections/Hero";
import { StackHighlights } from "@/components/sections/StackHighlights";
import { ProjectGrid } from "@/components/sections/ProjectGrid";
import { CredibilityStrip } from "@/components/sections/CredibilityStrip";
import { RevealSection } from "@/components/ui/RevealSection";
import { mvpProjects } from "@/content/projects";

// Animation note: the Hero renders statically (no entrance animation) since
// it's almost certainly the Largest Contentful Paint element on this page —
// animating it risks delaying LCP for no real UX gain, and it's already in
// the viewport on load so there's nothing to "reveal" via scroll anyway.
// Everything below the fold fades in once as it scrolls into view.
export default function HomePage() {
  const featuredProjects = mvpProjects.filter((p) => p.featured);

  return (
    <>
      <Hero
        headline="I build production-ready web apps and the communities that use them."
        subline="Frontend-first, growing into full-stack and DevOps and I've led the communities behind thousands of developers across East Africa and beyond."
      />

      <RevealSection>
        <StackHighlights />
      </RevealSection>

      <RevealSection>
        <section className="py-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Featured Projects</h2>
              <Button href="/projects" variant="ghost">
                View All Projects
              </Button>
            </div>
            <div className="mt-10">
              <ProjectGrid projects={featuredProjects} />
            </div>
          </Container>
        </section>
      </RevealSection>

      <RevealSection>
        <CredibilityStrip />
      </RevealSection>

      <RevealSection>
        <section className="py-20 text-center">
          <Container className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Looking to hire, collaborate, or just say hi?
            </h2>
            <div className="mt-6">
              <Button href="/contact" variant="primary">
                Get In Touch
              </Button>
            </div>
          </Container>
        </section>
      </RevealSection>
    </>
  );
}
