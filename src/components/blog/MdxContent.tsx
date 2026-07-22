import * as runtime from "react/jsx-runtime";

interface MdxContentProps {
  readonly code: string;
}

/**
 * Renders a Velite-compiled MDX function-body string as a React component.
 *
 * This component runs exclusively on the server (the page that imports it is
 * a Server Component), so the `new Function()` evaluation is not subject to
 * browser CSP restrictions. The compiled code is authored content — never
 * user-supplied — so the evaluation is safe.
 */
export default function MdxContent({ code }: MdxContentProps) {
  const fn = new Function(code);
  const Component = fn({ ...runtime }).default as React.ComponentType<{
    components?: Record<string, React.ComponentType>;
  }>;

  return <Component />;
}
