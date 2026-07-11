import Link from "next/link";
import { BookOpen, Award } from "lucide-react";
import { GithubIcon, LinkedinIcon, TwitterIcon } from "@/components/ui/BrandIcons";
import { Container } from "@/components/ui/Container";
import { NAV_LINKS, RESUME_ANCHOR, SITE_TAGLINE, SOCIAL_LINKS } from "@/lib/constants";

const socialIcons = [
  { href: SOCIAL_LINKS.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
  { href: SOCIAL_LINKS.twitter, label: "X (Twitter)", Icon: TwitterIcon },
  { href: SOCIAL_LINKS.hashnode, label: "Hashnode", Icon: BookOpen },
  { href: SOCIAL_LINKS.github, label: "GitHub", Icon: GithubIcon },
  { href: SOCIAL_LINKS.credly, label: "Credly", Icon: Award },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-white">
      <Container className="flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-base font-semibold text-brand-ink">{SITE_TAGLINE}</p>
          <p className="mt-3 font-signature text-2xl text-brand-blue">— Lawrence (jumalaw98)</p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-body hover:text-brand-blue"
            >
              {link.label}
            </Link>
          ))}
          <Link href={RESUME_ANCHOR} className="text-sm text-text-body hover:text-brand-blue">
            Resume
          </Link>
          <Link href="/contact" className="text-sm text-text-body hover:text-brand-blue">
            Contact
          </Link>
        </nav>

        <div className="flex gap-4">
          {socialIcons.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-text-muted transition-colors hover:text-brand-blue"
            >
              <Icon size={20} />
            </a>
          ))}
        </div>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-border py-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Lawrence Juma. All rights reserved.</p>
        <p>Built with Next.js, deployed on Vercel.</p>
      </Container>
    </footer>
  );
}
