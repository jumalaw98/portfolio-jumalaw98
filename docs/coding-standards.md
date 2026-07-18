# Coding Standards

## TypeScript

### Configuration

- **Strict mode** enabled in `tsconfig.json` (`"strict": true`).
- **Target**: ES2017.
- **Module resolution**: bundler.
- **JSX**: `react-jsx` (automatic runtime — no `import React` needed).
- **Path alias**: `@/*` maps to `./src/*`.

### Conventions

- **No `any` types** — use `unknown` and type guards when the type is not
  known ahead of time.
- **`readonly` props** — component interfaces and function parameters that are
  not mutated should use `readonly` modifiers.
- **Explicit return types** on public functions (page components, API routes,
  utility exports). Inferred types are acceptable for internal helpers.
- **`interface` over `type`** for object shapes that may be extended. Use
  `type` for unions, intersections, and mapped types.
- **Discriminated unions** for states that have multiple shapes (e.g.
  `HashnodeResult<T>`).

### Import Style

```typescript
// Named imports for components and utilities
import { Button } from "@/components/ui/Button";

// Type-only imports when only types are needed
import type { Project } from "@/types/project";

// Barrel imports for related items
import { getAllPosts, isHashnodeConfigured } from "@/lib/hashnode";
```

---

## Linting

ESLint 9 with flat config (`eslint.config.mjs`):

- **Base**: `eslint-config-next/core-web-vitals` — Next.js recommended rules.
- **TypeScript**: `eslint-config-next/typescript` — TypeScript-aware rules.

```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

Ignored paths: `.next/`, `out/`, `build/`, `next-env.d.ts`.

---

## Formatting

Prettier 3 with the following configuration (`.prettierrc`):

| Setting          | Value    |
| ---------------- | -------- |
| `semi`           | `true`   |
| `singleQuote`    | `false`  |
| `tabWidth`       | `2`      |
| `trailingComma`  | `all`    |
| `printWidth`     | `100`    |
| `bracketSpacing` | `true`   |
| `arrowParens`    | `always` |
| `endOfLine`      | `lf`     |

```bash
# Format all files
npm run format

# Check formatting (CI gate)
npm run format:check
```

---

## Naming Conventions

| Construct          | Convention                   | Example                                          |
| ------------------ | ---------------------------- | ------------------------------------------------ |
| Components         | PascalCase                   | `ProjectCard`, `ContactForm`                     |
| Files (components) | PascalCase                   | `BlogCard.tsx`, `Nav.tsx`                        |
| Files (utilities)  | camelCase                    | `validation.ts`, `rate-limit.ts`                 |
| Files (content)    | kebab-case                   | `africa-devops-summit.ts`                        |
| Functions          | camelCase                    | `getAllPosts()`, `isNavLinkActive()`             |
| Booleans           | `is`, `has`, `should` prefix | `isValid`, `hasPermission`, `shouldReduceMotion` |
| Constants          | UPPER_SNAKE_CASE             | `SITE_URL`, `NAV_LINKS`                          |
| Types/Interfaces   | PascalCase                   | `BlogPost`, `ProjectStatus`                      |
| CSS classes        | kebab-case (Tailwind)        | `brand-blue`, `text-body`                        |
| Git branches       | type/description             | `feat/dark-mode`, `fix/validation-bug`           |

---

## Component Conventions

### File Organization

```
src/components/<category>/
  ComponentName.tsx     # Component implementation
  ComponentName.test.tsx # Tests (if applicable)
```

### Component Structure

```typescript
"use client"; // only when interactivity is needed

import { type ReactNode } from "react";

interface ComponentProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function Component({ children, className }: ComponentProps) {
  return <div className={className}>{children}</div>;
}
```

### Client vs Server Components

- **Server Components** are the default. Only add `"use client"` when the
  component truly needs interactivity (event handlers, state, effects, browser
  APIs, custom hooks).
- **Leaf components** should be the client boundary — wrap a small interactive
  element rather than an entire page section.

---

## Code Quality Gates

The `npm run quality` script runs three checks sequentially:

1. **TypeScript** (`tsc --noEmit`) — no type errors.
2. **Prettier** (`prettier --check .`) — no formatting violations.
3. **ESLint** (`eslint .`) — no linting violations.

All three must pass before `npm run build` succeeds. The CI pipeline enforces
this on every PR.

---

## Comment Style

- Comments explain **why**, not **what** — the code should already say what it
  does.
- Use `// ─── Section divider ─────────────────────────────` style for file
  section markers.
- Use JSDoc (`/** ... */`) for public API functions and complex logic.
- No commented-out code. Remove it before committing.
- No `TODO`/`FIXME` left unresolved without context explaining what's missing
  and why.

---

## Security Standards

See `docs/security.md` for detailed security conventions.

Key rules enforced in code review:

- No hardcoded secrets — use environment variables only.
- Validate all external input — server-side validation is mandatory even when
  client-side validation exists.
- Use parameterized queries for any database access (not applicable yet, but
  required if DB access is added).
- Never pass unsanitized input to shell/exec calls.
- Never leak internal error details in user-facing responses.
