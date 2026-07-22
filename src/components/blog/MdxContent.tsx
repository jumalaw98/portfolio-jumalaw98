"use client";

import { useMemo } from "react";
import * as runtime from "react/jsx-runtime";

interface MdxContentProps {
  readonly code: string;
}

/**
 * Renders a Velite-compiled MDX function-body string as a React component.
 *
 * Velite's `s.mdx()` compiles MDX to a JavaScript module body that, when
 * evaluated with `react/jsx-runtime` bindings, produces a default React
 * component.  The compiled code is authored content — never user-supplied —
 * so the `new Function()` evaluation is safe at build-time and server-side.
 */
export default function MdxContent({ code }: MdxContentProps) {
  const Component = useMemo(() => {
    // Wrap the MDX module body in a function that receives the JSX runtime
    // and returns the default export (the MDX component).
    // code is authored Velite-compiled MDX, not user-supplied — safe evaluation
    // NOSONAR
    const fn = new Function(code);
    // NOSONAR
    return fn({ ...runtime }).default as React.ComponentType<{
      components?: Record<string, React.ComponentType>;
    }>;
  }, [code]);

  return <Component />;
}
