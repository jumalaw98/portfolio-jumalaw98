/**
 * Filesystem path containment helpers for build/CI scripts.
 *
 * Why this exists: content scripts (`scripts/generate-summaries.ts`,
 * `scripts/find-ready-posts.ts`, `scripts/publish-devto.ts`,
 * `scripts/check-placeholders.ts`) walk `src/content/blog/`, read every
 * `.mdx` file they find, and write results back.
 * Any path handed to `node:fs` must therefore be constrained to a trusted base
 * directory, otherwise a path that escapes the content tree (e.g. via a
 * symlinked file committed in a pull request) turns a build step into an
 * arbitrary-file read (whose contents are then sent to third-party AI APIs) or
 * an arbitrary-file overwrite.
 *
 * Two checks are provided because they defend different things:
 *
 *   - {@link assertWithinBase} — lexical containment. Stops `../` traversal and
 *     absolute paths, and is the check to use before creating a path.
 *   - {@link assertRealPathWithinBase} — symlink-aware containment. Resolves
 *     symlinks first, so a link *inside* the base directory that points outside
 *     it is rejected.
 *
 * {@link listFilesWithinBase} is the hardened directory walk used by scripts:
 * it never follows symlinked directories, never returns symlinks, and only
 * returns files whose real path is inside the base directory.
 */

import { globSync, realpathSync } from "node:fs";
import { resolve, sep } from "node:path";

/**
 * Lexical containment check.
 *
 * @param baseDir - Trusted base directory
 * @param candidate - Path to test
 * @returns `true` when `candidate` is `baseDir` itself or nested inside it
 */
export function isWithinBase(baseDir: string, candidate: string): boolean {
  const base = resolve(baseDir);
  const target = resolve(candidate);
  if (target === base) return true;
  // A filesystem root already ends with the separator ("/" on POSIX, "C:\" on
  // Windows): appending another one would double it and reject every valid
  // descendant of the root.
  const prefix = base.endsWith(sep) ? base : base + sep;
  return target.startsWith(prefix);
}

/**
 * Assert that a path is lexically inside `baseDir`.
 *
 * @param baseDir - Trusted base directory
 * @param candidate - Path to validate
 * @returns The resolved (absolute, normalized) path
 * @throws When the path escapes `baseDir`
 */
export function assertWithinBase(baseDir: string, candidate: string): string {
  if (!isWithinBase(baseDir, candidate)) {
    throw new Error(`Refusing to use path outside ${resolve(baseDir)}: ${resolve(candidate)}`);
  }
  return resolve(candidate);
}

/**
 * Assert that a path resolves (after following symlinks) inside `baseDir`.
 *
 * Use this for paths that already exist, immediately before reading or writing
 * them: it defeats symlink escapes that a purely lexical check cannot see.
 *
 * @param baseDir - Trusted base directory
 * @param candidate - Existing path to validate
 * @returns The canonical real path
 * @throws When the path escapes `baseDir` or cannot be resolved
 */
export function assertRealPathWithinBase(baseDir: string, candidate: string): string {
  const realBase = realpathSync(resolve(baseDir));
  const realTarget = realpathSync(resolve(candidate));

  if (!isWithinBase(realBase, realTarget)) {
    throw new Error(
      `Refusing to use path outside ${realBase}: ${realTarget} (resolved from ${resolve(candidate)})`,
    );
  }

  return realTarget;
}

export interface ListFilesWithinBaseOptions {
  /** Trusted base directory to search. */
  readonly baseDir: string;
  /** Glob pattern evaluated relative to `baseDir` (e.g. every `.mdx` file, recursively). */
  readonly pattern: string;
  /** Only files ending with this suffix are returned (defence in depth). */
  readonly extension: string;
}

/**
 * List regular files below `baseDir` that match `pattern`.
 *
 * Hardening:
 *   - glob runs with `followSymlinks: false`, so a symlinked directory inside
 *     the tree is never descended into
 *   - symlinked entries and non-regular files are skipped
 *   - each result is re-checked with its real path, so a symlinked *file* that
 *     points outside the base directory can never be returned
 *
 * @param options - Base directory, glob pattern and required extension
 * @returns Absolute, sorted paths of the matching files
 * @throws When `baseDir` does not exist or cannot be resolved. Callers that
 *          treat "no files" as a valid result (e.g. scripts/find-ready-posts.ts,
 *          whose documented contract is to always print an empty list) must
 *          handle that themselves.
 */
export function listFilesWithinBase(options: ListFilesWithinBaseOptions): string[] {
  const base = resolve(options.baseDir);
  const realBase = realpathSync(base);

  const entries = globSync(options.pattern, {
    cwd: base,
    withFileTypes: true,
    followSymlinks: false,
  });

  const files: string[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || entry.isSymbolicLink()) continue;
    if (!entry.name.endsWith(options.extension)) continue;

    const candidate = resolve(entry.parentPath, entry.name);
    if (!isWithinBase(base, candidate)) continue;

    let realCandidate: string;
    try {
      realCandidate = realpathSync(candidate);
    } catch {
      // Broken link or a file removed mid-walk — ignore it.
      continue;
    }
    if (!isWithinBase(realBase, realCandidate)) continue;

    files.push(candidate);
  }

  return files.sort((a, b) => a.localeCompare(b));
}
