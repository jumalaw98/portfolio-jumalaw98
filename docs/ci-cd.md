# CI/CD

## Overview

The project uses GitHub Actions for continuous integration. Two workflows run
on every pull request and push to `main`, plus automated dependency management
via Dependabot.

---

## CI Pipeline (`.github/workflows/ci.yml`)

A 3-tier pipeline that runs on every PR to `main` and on direct pushes.

```
Tier 1 (parallel):
  ├── Code Quality  — ESLint + Prettier check
  ├── TypeScript    — typecheck (tsc --noEmit)
  └── Audit         — npm audit (high/critical severity only)

Tier 2 (after Tier 1):
  └── Build         — Next.js production build (cached)

Tier 3 (after Tier 2):
  └── Bundle Size   — bundle analysis artifact (informational)
```

### Tier 1 — Parallel Static Analysis

#### Code Quality

- **Runner:** `ubuntu-latest`, timeout 5 minutes.
- **Steps:** Checkout → Setup Node 22 → `npm ci` → `npm run lint` → `npm run format:check`.
- **Status check name:** `Code Quality`.

#### TypeScript

- **Runner:** `ubuntu-latest`, timeout 5 minutes.
- **Steps:** Checkout → Setup Node 22 → `npm ci` → `npm run typecheck`.
- **Status check name:** `TypeScript`.

#### Dependency Audit

- **Runner:** `ubuntu-latest`, timeout 3 minutes.
- **Steps:** Checkout → Setup Node 22 → `npm ci` → `npm audit --audit-level=high`.
- **`continue-on-error: true`** — warnings don't block PRs.
- **Status check name:** `Dependency Audit`.

### Tier 2 — Build

- **Depends on:** `code-quality` and `type-check` (not audit).
- **Runner:** `ubuntu-latest`, timeout 10 minutes.
- **Steps:**
  1. Checkout.
  2. Setup Node 22 with npm cache.
  3. Restore Next.js build cache (keyed on lockfile + source files hash).
  4. `npm ci`.
  5. `npx next build` (not `npm run build`, since lint+typecheck are upstream).
  6. Persist `.next` output artifact for downstream jobs.
- **Status check name:** `Build`.

### Tier 3 — Bundle Size (Informational)

- **Depends on:** `build`.
- **Runner:** `ubuntu-latest`, timeout 5 minutes.
- **Steps:**
  1. Checkout.
  2. Setup Node 22 with npm cache.
  3. `npm ci`.
  4. `npm run analyze` (builds with `@next/bundle-analyzer`).
  5. Upload `.next/analyze/` as artifact (30-day retention).
- **Status check name:** `Bundle Size`.
- **Does not block PRs** — informational only.

### Concurrency

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

- New commits on a PR cancel in-progress runs (fast feedback).
- Main branch runs are never cancelled (all commits deploy).

### Environment Variables

```yaml
env:
  NODE_VERSION: "22"
  NEXT_PUBLIC_SITE_URL: ${{ vars.NEXT_PUBLIC_SITE_URL || 'https://jumalaw98.vercel.app' }}
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: ${{ vars.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'jumalaw98.vercel.app' }}
```

---

## CodeQL Analysis (`.github/workflows/codeql-analysis.yml`)

GitHub's security scanner for JavaScript/TypeScript code.

### Triggers

- Every PR to `main`.
- Every push to `main`.
- Weekly schedule (Monday 08:00 UTC).
- Manual via `workflow_dispatch`.

### Configuration

- **Language matrix:** `javascript-typescript`.
- **`fail-fast: false`** — always completes all languages.
- **Permissions:** `actions: read`, `contents: read`, `security-events: write`.
- **Timeout:** 15 minutes.

### Steps

1. Checkout.
2. Initialize CodeQL with the JavaScript/TypeScript language.
3. Build: `npm ci` → `npx next build`.
4. Perform CodeQL analysis.
5. On failure: upload SARIF results as artifact (7-day retention).

### Notes

- CodeQL is **informational** (not a required status check) to avoid blocking
  merges on false positives or noisy results.
- Separate from `ci.yml` because CodeQL is slower (~3 min) and has different
  failure semantics.

---

## Dependabot (`.github/dependabot.yml`)

### npm Dependencies

| Setting             | Value                       |
| ------------------- | --------------------------- |
| Check interval      | Daily (07:00 AM ET)         |
| Open PR limit       | 10                          |
| Versioning strategy | `increase`                  |
| Labels              | `dependencies`, `automerge` |
| Reviewer            | `jumalaw98`                 |

**Dependency groups:**

| Group               | Included packages                                        |
| ------------------- | -------------------------------------------------------- |
| `react`             | `react`, `react-dom`, `@types/react`, `@types/react-dom` |
| `nextjs`            | `next`, `eslint-config-next`, `@next/*`                  |
| `typescript-eslint` | `typescript`, `@typescript-eslint/*`, `eslint`           |
| `tailwind`          | `tailwindcss`, `@tailwindcss/*`                          |
| `minor-and-patch`   | All other packages (minor/patch only)                    |

### GitHub Actions

| Setting        | Value                                        |
| -------------- | -------------------------------------------- |
| Check interval | Weekly (Monday 07:00 AM ET)                  |
| Open PR limit  | 5                                            |
| Labels         | `dependencies`, `github-actions`             |
| Groups         | All actions into a single `actions` group PR |

---

## Required Status Checks

For branch protection on `main`, the following CI jobs are required:

1. `Code Quality`
2. `TypeScript`
3. `Dependency Audit`
4. `Build`

The `Bundle Size` and `CodeQL` jobs are informational.

---

## Local CI Debug

To reproduce CI checks locally before pushing:

```bash
# All checks in sequence (matches CI Tier 1 + build)
npm run build

# Individual checks
npm run typecheck
npm run format:check
npm run lint
```
