type ClassValue = string | false | null | undefined;

/** Joins class names, skipping falsy values. Lightweight stand-in for `clsx`. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Whether a nav link should be shown as active for the given pathname.
 * "/" only matches the exact home route; every other href also matches its
 * nested routes (e.g. "/projects" stays active on "/projects/[slug]").
 */
export function isNavLinkActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
