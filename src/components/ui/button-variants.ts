/**
 * Button variant → class mapping.
 *
 * The variant arrives as a prop, i.e. from outside this module, and TypeScript's
 * union type is erased at runtime: a JavaScript caller, a spread of untyped
 * data or a future JSON boundary can supply any string. Resolving classes with
 * `variantClasses[variant]` would therefore perform a *dynamic property lookup*
 * on an inherited object, where keys such as `__proto__` or `constructor`
 * resolve to `Object.prototype` / `Object` instead of a class string.
 *
 * The lookup is consequently done through a `Map` after an explicit allowlist
 * check: a key outside the closed union can only ever produce the documented
 * default, and inherited properties are unreachable.
 */

export const BUTTON_VARIANTS = ["primary", "secondary", "ghost"] as const;

export type Variant = (typeof BUTTON_VARIANTS)[number];

/** Variant used when the prop is missing or not a known variant. */
export const DEFAULT_BUTTON_VARIANT: Variant = "primary";

/**
 * Classes for {@link DEFAULT_BUTTON_VARIANT}. Kept as a named constant so the
 * fallback below can reference it without a non-null assertion: the map is
 * seeded with this same constant for the default key, so the fallback can
 * never be stale relative to the default variant.
 */
const DEFAULT_CLASSES = "bg-brand-orange text-white hover:bg-brand-orange-dark";

const VARIANT_CLASSES = new Map<Variant, string>([
  // Orange is reserved for the primary action per branding-guide.md color usage rules
  [DEFAULT_BUTTON_VARIANT, DEFAULT_CLASSES],
  ["secondary", "bg-brand-blue text-white hover:bg-brand-blue-dark"],
  ["ghost", "border border-border text-text-body hover:border-brand-blue hover:text-brand-blue"],
]);

/** True for values inside the closed variant union (runtime allowlist check). */
export function isButtonVariant(value: unknown): value is Variant {
  return typeof value === "string" && (BUTTON_VARIANTS as readonly string[]).includes(value);
}

/**
 * Resolve the class names for a variant.
 *
 * @param variant - Untrusted variant value from component props
 * @returns Class names for the variant, or for the default when it is unknown
 */
export function resolveVariantClasses(variant: unknown): string {
  const resolved = isButtonVariant(variant) ? variant : DEFAULT_BUTTON_VARIANT;
  return VARIANT_CLASSES.get(resolved) ?? DEFAULT_CLASSES;
}
