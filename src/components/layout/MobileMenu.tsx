import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NAV_LINKS, PRIMARY_CTA } from "@/lib/constants";
import { cn, isNavLinkActive } from "@/lib/utils";

interface MobileMenuProps {
  pathname: string;
  onNavigate: () => void;
}

export function MobileMenu({ pathname, onNavigate }: MobileMenuProps) {
  return (
    <div className="border-t border-border bg-white md:hidden">
      <Container className="flex flex-col gap-1 py-4">
        {NAV_LINKS.map((link) => {
          const active = isNavLinkActive(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-2 py-3 text-base font-medium transition-colors",
                active
                  ? "bg-brand-blue-tint text-brand-blue"
                  : "text-text-body hover:bg-brand-blue-tint hover:text-brand-blue",
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <Button
          href={PRIMARY_CTA.href}
          variant="primary"
          className="mt-2 w-full"
        >
          {PRIMARY_CTA.label}
        </Button>
      </Container>
    </div>
  );
}
