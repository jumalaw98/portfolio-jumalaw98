# Contributing

## Welcome

This is a personal portfolio site, but contributions are welcome for bug fixes,
security improvements, and documentation updates. Feature additions should be
discussed in an issue first to ensure alignment with the project's goals.

---

## Getting Started

1. Read `docs/getting-started.md` for setup instructions.
2. Review `docs/coding-standards.md` for code conventions.
3. Review `docs/architecture.md` to understand the codebase structure.

---

## Branch Naming

Use descriptive branch names with type prefixes:

```
feat/add-dark-mode
fix/contact-form-validation
chore/update-dependencies
docs/improve-readme
security/csp-update
perf/image-optimization
```

---

## Development Workflow

### 1. Create a branch

```bash
git checkout -b type/description
```

### 2. Make changes

Follow the project's conventions:

- TypeScript strict mode — no `any` types.
- Components are Server Components by default; only add `"use client"` for
  interactivity.
- Content lives in `src/content/` as typed data files.
- Validate all external input server-side.

### 3. Run quality checks

```bash
npm run quality
```

This runs type checking, formatting check, and linting. All must pass.

### 4. Build

```bash
npm run build
```

The build runs quality checks before the Next.js build. Verify it passes
locally.

### 5. Commit

```bash
git add <files>
git commit -m "type: concise description"
```

Commit messages should be clear and descriptive. Reference related issues
when applicable.

### 6. Push and open a PR

```bash
git push -u origin type/description
```

CI runs automatically on all PRs to `main`.

---

## Pull Request Guidelines

### Before Submitting

- [ ] Run `npm run quality` — no type, lint, or format errors.
- [ ] Run `npm run build` — production build succeeds.
- [ ] Test the changes locally — load the relevant pages in a browser.
- [ ] Review the checklist in `docs/coding-standards.md` for code quality.
- [ ] Ensure no secrets are committed (check `git diff` for API keys).
- [ ] Update or add documentation if the change affects public APIs,
      components, or workflows.

### PR Description

Include:

- **What** changed and why.
- **How** to test the change.
- **Screenshots** for UI changes.
- **Related issues** (e.g. "Closes #123").

### CI Requirements

The following checks must pass before merging:

| Check              | Description                    |
| ------------------ | ------------------------------ |
| `Code Quality`     | ESLint + Prettier              |
| `TypeScript`       | `tsc --noEmit` (strict mode)   |
| `Dependency Audit` | `npm audit --audit-level=high` |
| `Build`            | `next build`                   |

---

## Code Review

All PRs require review before merging. Reviewers will check:

- Adherence to coding standards (type safety, naming, component conventions).
- Security (input validation, CSP, no secrets).
- Performance (no unnecessary client JS, proper image optimization).
- Documentation (APIs, components, and workflows documented).
- Testability (pure functions where possible, separation of concerns).

---

## Documentation

- All documentation lives in `docs/`.
- When adding a feature, update or create the relevant doc file.
- When changing behavior, update existing docs to match.
- Documentation files are Markdown with a title heading and clear section
  structure.

### Documentation Index

| File                   | Covers                                           |
| ---------------------- | ------------------------------------------------ |
| `architecture.md`      | System architecture, data flow, design decisions |
| `project-structure.md` | Full directory and file listing                  |
| `getting-started.md`   | Setup and first-time build                       |
| `development.md`       | Development workflow and scripts                 |
| `coding-standards.md`  | TypeScript, formatting, naming, conventions      |
| `components.md`        | Component API and usage                          |
| `routing.md`           | All routes, layouts, dynamic params              |
| `api.md`               | API route documentation                          |
| `security.md`          | Security headers, CSP, input validation          |
| `performance.md`       | Performance optimizations                        |
| `seo.md`               | Metadata, structured data, sitemap               |
| `deployment.md`        | Deployment configuration                         |
| `ci-cd.md`             | CI/CD pipeline details                           |
| `troubleshooting.md`   | Common issues and fixes                          |
| `contributing.md`      | This file                                        |

---

## Testing

The project currently does not include automated tests. When adding tests:

- Place test files next to the source file they test: `Component.test.tsx`.
- Use testing-library/react for component tests.
- Unit-test pure functions (validation, utilities) directly.
- Run tests before pushing: `npm test` (once configured).

---

## Security

Report security vulnerabilities privately via GitHub's Security Advisories
or by contacting the repository owner directly. Do not open public issues for
security vulnerabilities.

For security-related contributions, see `docs/security.md` for the project's
security architecture.
