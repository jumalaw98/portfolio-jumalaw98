import { Mail } from "lucide-react";
import { LinkedinIcon } from "@/components/ui/BrandIcons";
import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/sections/ContactForm";
import { RevealSection } from "@/components/ui/RevealSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/constants";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Get in touch with Lawrence Juma (jumalaw98) about full-time React/Next.js opportunities, freelance projects, or speaking and community partnership inquiries.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <Container className="max-w-3xl py-16">
      <JsonLd data={breadcrumbJsonLd([{ name: "Contact", path: "/contact" }])} />

      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Contact</h1>
      <p className="mt-4 text-lg text-text-body">
        Tell me what you&apos;re building. I usually reply within 48 hours.
      </p>

      <RevealSection className="mt-12 grid gap-12 md:grid-cols-[1.2fr_0.8fr]">
        <ContactForm />

        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
              Direct
            </h2>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-2 flex items-center gap-2 text-text-body hover:text-brand-blue"
            >
              <Mail size={18} />
              {CONTACT_EMAIL}
            </a>
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 text-text-body hover:text-brand-blue"
            >
              <LinkedinIcon />
              LinkedIn
            </a>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
              Elsewhere
            </h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              <li>
                <a
                  href={SOCIAL_LINKS.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-body hover:text-brand-blue"
                >
                  X (Twitter)
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-body hover:text-brand-blue"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.hashnode}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-body hover:text-brand-blue"
                >
                  Hashnode
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.credly}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-body hover:text-brand-blue"
                >
                  Credly
                </a>
              </li>
            </ul>
          </div>
        </div>
      </RevealSection>
    </Container>
  );
}
