import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { resolveVariantClasses } from "./button-variants";
import type { Variant } from "./button-variants";

// Variant → class resolution lives in ./button-variants so the dynamic lookup
// is an allowlisted `Map` access rather than an inherited-property read, and so
// it can be unit tested without pulling `next/link` into the test environment.
export type { Variant };

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition-colors duration-150";

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

interface ButtonAsLink
  extends CommonProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> {
  href: string;
}

interface ButtonAsButton
  extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  href?: never;
}

type ButtonProps = ButtonAsLink | ButtonAsButton;

export function Button({ variant = "primary", children, className, ...props }: ButtonProps) {
  const classes = cn(baseClasses, resolveVariantClasses(variant), className);

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
