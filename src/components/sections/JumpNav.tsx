interface JumpNavItem {
  href: string;
  label: string;
}

interface JumpNavProps {
  items: JumpNavItem[];
}

/**
 * Plain anchor-link row for jumping around the longer, merged About page.
 * Deliberately not a scroll-spy component (no active-section tracking) to
 * keep this page's client JS minimal — see README for the trade-off note.
 */
export function JumpNav({ items }: JumpNavProps) {
  return (
    <nav aria-label="Page sections" className="flex flex-wrap gap-x-5 gap-y-2">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="text-sm font-medium text-brand-blue underline decoration-brand-blue-light underline-offset-4 transition-colors hover:text-brand-blue-dark"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
