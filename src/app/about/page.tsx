import Image from "next/image";
import {
  Download,
  GraduationCap,
  Award as AwardIcon,
  Users,
  Heart,
  Code2,
  Route,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RevealSection } from "@/components/ui/RevealSection";
import { Timeline } from "@/components/sections/Timeline";
import { JumpNav } from "@/components/sections/JumpNav";
import { timeline } from "@/content/timeline";
import { education } from "@/content/education";
import {
  leadCertifications,
  additionalCertifications,
  CREDLY_PROFILE_URL,
} from "@/content/certifications";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title:
    "About — React/Next.js Developer, Tech Community Leader & Cybersecurity Enthusiast in Nairobi",
  description:
    "Lawrence Juma is a Nairobi-based React/Next.js developer growing into full-stack and DevOps, with a parallel track record leading technical communities across East Africa. Includes background, skills, resume, education, and certifications.",
  path: "/about",
});

const SKILLS_SUMMARY = [
  { label: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
  {
    label: "Learning / Cloud & DevOps",
    items: ["Docker", "Azure", "Cloudflare", "GitHub Actions", "PostgreSQL", "Redis", "Nginx"],
  },
  { label: "Tools & Automation", items: ["n8n", "Zapier", "Power Automate", "Prisma", "Supabase"] },
  {
    label: "Leadership",
    items: [
      "Community & Events Management",
      "Technical writing leadership",
      "Conference organizing",
      "Sponsor/partner relations",
    ],
  },
];

const JUMP_NAV_ITEMS = [
  { href: "#career-journey", label: "Career Journey" },
  { href: "#skills", label: "Skills" },
  { href: "#resume", label: "Resume" },
  { href: "#education", label: "Education" },
  { href: "#certifications", label: "Certifications" },
  { href: "#community-leadership", label: "Community" },
];

const RESUME_PDF_PATH =
  "https://drive.google.com/file/d/1cwQ3kqzz3NHshb4IjuAggorCOFk26KwO/view?usp=sharing";

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "About", path: "/about" }])} />

      {/* 1. Introduction */}
      <section className="border-b border-border bg-brand-blue-tint py-16">
        <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-brand-blue md:mx-0">
            <Image
              src="https://ik.imagekit.io/lawz/law/jumalaw98.jpg"
              alt="Lawrence Juma"
              fill
              priority
              sizes="(min-width: 768px) 33vw, 80vw"
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About</h1>
            <p className="mt-4 text-lg text-text-body">
              I&apos;m a frontend-leaning developer still deepening my backend and cloud skills —
              and I learn fastest by shipping real things for real communities. I&apos;m based in
              Nairobi, Kenya, and I&apos;ve spent the last several years building software and
              building the technical communities that use it, at the same time.
            </p>
            <div className="mt-6">
              <JumpNav items={JUMP_NAV_ITEMS} />
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Professional Summary */}
      <RevealSection>
        <section className="py-16">
          <Container className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Professional Summary</h2>
            <p className="mt-4 text-lg text-text-body">
              Most of my day-to-day is React, TypeScript, and Next.js — building and keeping
              production sites running for real communities, not just shipping and walking away. The
              backend and cloud side is where I&apos;m still catching up, honestly: I&apos;ve
              hardened infrastructure on Azure and Cloudflare, set up CI/CD with GitHub Actions, and
              I&apos;m slowly picking up automation tools like n8n and Zapier along the way. Ask me
              to rate my own skill level and I&apos;ll tell you straight — strong on the frontend,
              still finding my footing on the backend, no interest in pretending otherwise.
            </p>
          </Container>
        </section>
      </RevealSection>

      {/* 3. Career Journey */}
      <RevealSection>
        <section id="career-journey" className="scroll-mt-24 border-t border-border py-16">
          <Container className="max-w-3xl">
            <div className="flex items-center gap-3">
              <Route size={22} className="text-brand-blue" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">The Path So Far</h2>
            </div>
            <p className="mt-3 text-text-body">
              My developer journey and my community leadership both started in 2022 — running in
              parallel from the start, not as a pivot from one to the other.
            </p>
            <div className="mt-10">
              <Timeline entries={timeline} />
            </div>
          </Container>
        </section>
      </RevealSection>

      {/* 4. Skills & Expertise */}
      <RevealSection>
        <section
          id="skills"
          className="scroll-mt-24 border-t border-border bg-brand-blue-tint py-16"
        >
          <Container className="max-w-3xl">
            <div className="flex items-center gap-3">
              <Code2 size={22} className="text-brand-blue" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Skills &amp; Expertise
              </h2>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {SKILLS_SUMMARY.map((group) => (
                <div key={group.label} className="rounded-lg border border-border bg-white p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
                    {group.label}
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full bg-brand-blue-tint px-2.5 py-1 font-mono text-xs text-brand-blue-dark"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </RevealSection>

      {/* 5. Resume */}
      <RevealSection>
        <section id="resume" className="scroll-mt-24 border-t border-border py-16">
          <Container className="max-w-3xl">
            <div className="flex items-center gap-3">
              <Download size={22} className="text-brand-blue" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Resume</h2>
            </div>
            <p className="mt-4 text-lg text-text-body">
              Below is my current developer-focused resume. Looking for something tailored to a
              specific role? Reach out and I&apos;ll send a focused version. The full skills
              breakdown is{" "}
              <a href="#skills" className="font-medium text-brand-blue hover:text-brand-blue-dark">
                just above ↑
              </a>
              , so this section keeps to the essentials.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Button href={RESUME_PDF_PATH} target="_blank" variant="primary">
                <Download size={18} />
                Download PDF
              </Button>
              <Button href="/contact" variant="ghost">
                Request a Tailored Version
              </Button>
            </div>
          </Container>
        </section>
      </RevealSection>

      {/* 6. Education */}
      <RevealSection>
        <section
          id="education"
          className="scroll-mt-24 border-t border-border bg-brand-blue-tint py-16"
        >
          <Container className="max-w-3xl">
            <div className="flex items-center gap-3">
              <GraduationCap size={22} className="text-brand-blue" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Education</h2>
            </div>
            <ul className="mt-8 flex flex-col gap-4">
              {education.map((entry) => (
                <li
                  key={`${entry.institution}-${entry.credential}`}
                  className="rounded-lg border border-border bg-white p-5"
                >
                  <p className="font-semibold text-brand-ink">{entry.credential}</p>
                  <p className="text-sm font-medium text-brand-blue-dark">{entry.institution}</p>
                  <p className="mt-1 font-mono text-xs text-text-muted">{entry.dates}</p>
                  {entry.note ? <p className="mt-1 text-xs text-text-muted">{entry.note}</p> : null}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </RevealSection>

      {/* 7. Certifications */}
      <RevealSection>
        <section id="certifications" className="scroll-mt-24 border-t border-border py-16">
          <Container className="max-w-3xl">
            <div className="flex items-center gap-3">
              <AwardIcon size={22} className="text-brand-blue" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Certifications</h2>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {leadCertifications.map((cert) => (
                <div key={cert.name} className="rounded-lg border border-border bg-white p-4">
                  <p className="font-semibold text-brand-ink">{cert.name}</p>
                  <p className="mt-1 text-sm text-text-muted">
                    {cert.issuer}
                    {cert.year ? ` · ${cert.year}` : ""}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-text-muted">
              +{additionalCertifications.length} more —{" "}
              <a
                href={CREDLY_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-blue hover:text-brand-blue-dark"
              >
                view on Credly
              </a>
            </p>
          </Container>
        </section>
      </RevealSection>

      {/* 8. Community Leadership */}
      <RevealSection>
        <section
          id="community-leadership"
          className="scroll-mt-24 border-t border-border bg-brand-blue-tint py-16"
        >
          <Container className="max-w-3xl">
            <div className="flex items-center gap-3">
              <Users size={22} className="text-brand-blue" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Why Community Work Matters To My Engineering
              </h2>
            </div>
            <p className="mt-4 text-lg text-text-body">
              I didn&apos;t come to community-building as a side hobby — it&apos;s taught me things
              my code never could. Running events for hundreds of people means you learn to plan for
              failure, communicate under pressure, and ship on a deadline that doesn&apos;t move for
              anyone. Leading a community of thousands means you get fast, honest feedback on
              whether something actually works for the people using it. Every platform I build
              professionally is better because I&apos;ve also had to be the person answering support
              messages at 11pm before a conference. The two things aren&apos;t separate skills —
              they&apos;re the same skill, pointed in two directions.
            </p>
            <div className="mt-6">
              <Button href="/community" variant="ghost">
                See Community &amp; Speaking →
              </Button>
            </div>
          </Container>
        </section>
      </RevealSection>

      {/* 9. Personal Note */}
      <RevealSection>
        <section className="border-t border-border py-16">
          <Container className="max-w-3xl">
            <div className="flex items-center gap-3">
              <Heart size={22} className="text-brand-orange" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A Personal Note</h2>
            </div>
            <p className="mt-4 text-lg text-text-body">
              I like building things that outlast the excitement of launching them. It&apos;s easy
              to ship a v1 — the real test is whether you&apos;re still improving it a year later,
              and I&apos;ve tried to make that my habit, whether it&apos;s a codebase or a
              community. Most of what I&apos;ve learned about software has come from building things
              people in my own community actually needed, not from projects designed to look good on
              a portfolio. Over the next few years I want to keep deepening on the engineering side
              — backend, cloud, real systems thinking — while staying involved in the technical
              communities that shaped how I think about this work in the first place. If you&apos;re
              building something and want a second pair of hands that cares about both the code and
              the people using it, I&apos;d like to hear about it.
            </p>
          </Container>
        </section>
      </RevealSection>

      {/* 10. Call to Action */}
      <section className="border-t border-border bg-brand-blue-dark py-16 text-center">
        <Container className="max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Got something worth building? Let&apos;s talk.
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button href="/contact" variant="primary">
              Get In Touch
            </Button>
            <Button
              href="/projects"
              variant="ghost"
              className="border-white text-white hover:border-brand-orange hover:text-brand-orange"
            >
              View Projects
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
