# Development

## Available Scripts

| Script         | Command                                                     | Description                              |
| -------------- | ----------------------------------------------------------- | ---------------------------------------- |
| `dev`          | `next dev`                                                  | Start the development server (Turbopack) |
| `build`        | `npm run quality && next build`                             | Quality checks then production build     |
| `start`        | `next start`                                                | Start production server (after `build`)  |
| `typecheck`    | `tsc --noEmit`                                              | TypeScript type checking                 |
| `lint`         | `eslint .`                                                  | ESLint across the project                |
| `format`       | `prettier --write .`                                        | Format all files in place                |
| `format:check` | `prettier --check .`                                        | Check formatting (CI gate)               |
| `quality`      | `npm run typecheck && npm run format:check && npm run lint` | All quality checks in sequence           |
| `analyze`      | `cross-env ANALYZE=true next build --webpack`               | Build with bundle analyzer               |

## Development Workflow

### 1. Start the dev server

```bash
npm run dev
```

The server starts on `http://localhost:3000` with Turbopack for fast HMR.

### 2. Make changes

- **Pages** — add or modify files in `src/app/` following the App Router
  conventions (see `docs/routing.md`).
- **Components** — create or modify files in `src/components/` by category
  (see `docs/components.md`).
- **Content** — update TypeScript data files in `src/content/`.
- **Styles** — modify Tailwind classes or `src/app/globals.css` (`@theme`
  tokens).

### 3. Run quality checks frequently

```bash
npm run quality
```

This runs type checking, format checking, and linting. The `build` script
automatically gates on all three, so catching issues early saves time.

### 4. Build locally before pushing

```bash
npm run build
```

Produces an optimized production build. Always verify this passes before
opening a PR.

## Adding Content

### Adding a case study

1. Create `src/content/projects/<slug>.ts` following the `Project` type.
2. Add the import + entry to `src/content/projects/index.ts`.
3. The case study page is automatically available at `/projects/<slug>`.
4. If the project should appear on the home page, set `featured: true`.

### Adding a blog post

1. Publish on [Hashnode](https://hashnode.com/).
2. Ensure `HASHNODE_PUBLICATION_HOST` is set.
3. The post appears on `/blog` within the ISR revalidation window (1 hour).
4. To force an immediate refresh, trigger a redeploy or wait for the cache
   to expire.

### Adding community content

- **Leadership role** — add to the `communityRoles` array in
  `src/content/community.ts`.
- **Speaking engagement** — add to the `speakingEngagements` array in
  `src/content/community.ts`.
- **Impact stats** — update `src/content/impact-stats.ts` (aggregates are
  computed automatically from other content files).

## Analyzing Bundle Size

```bash
npm run analyze
```

Generates HTML reports in `.next/analyze/` for client, edge, and server
bundles. Open the HTML files in a browser to inspect per-route bundle sizes.

## Troubleshooting Common Issues

See `docs/troubleshooting.md` for solutions to common problems.
