"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NAV_LINKS, PRIMARY_CTA, SITE_ALIAS } from "@/lib/constants";
import { cn, isNavLinkActive } from "@/lib/utils";
import { MobileMenu } from "./MobileMenu";

export function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function handleScroll() {
      // React bails out of re-rendering when the new state === the old
      // state, so this only actually triggers a render right at the
      // threshold crossing, not on every scroll pixel.
      setIsScrolled(window.scrollY > 8);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-white/90 backdrop-blur-sm transition-shadow duration-200",
        isScrolled ? "border-border shadow-sm" : "border-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-display text-lg font-bold text-brand-ink"
          onClick={() => setIsMenuOpen(false)}
        >
          {SITE_ALIAS}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active = isNavLinkActive(link.href, pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-1 text-sm font-medium transition-colors",
                  active ? "text-brand-blue" : "text-text-body hover:text-brand-blue",
                )}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -bottom-[1px] left-0 h-0.5 w-full rounded-full bg-brand-blue transition-transform duration-200 ease-out",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            );
          })}
          <Button href={PRIMARY_CTA.href} variant="primary" className="px-4 py-2">
            {PRIMARY_CTA.label}
          </Button>
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-brand-ink md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </Container>

      {isMenuOpen ? (
        <MobileMenu pathname={pathname} onNavigate={() => setIsMenuOpen(false)} />
      ) : null}
    </header>
  );
}
