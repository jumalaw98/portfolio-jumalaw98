/**
 * Filesystem path containment helpers for build/CI scripts.
 *
 * This module is the **single `node:fs` chokepoint** for the content scripts —
 * they no longer syscall at all. Every path reaching `node:fs` below is either a
 * trusted root derived from a script's own location, or a caller-supplied target
 * asserted to be inside that root immediately before the call. Because the set
 * of files is data (every `.mdx` under the content tree), a literal path is
 * impossible, so each syscall carries a line-level
 * `security/detect-non-literal-fs-filename` disable naming the guard that
 * justifies it. A *file-level* disable would also cover any future syscall added
 * to this file, which is precisely the property we do not want.
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
 * {@link listFilesWithinBase} is the hardened directory walk used by scripts.
 * Containment is enforced per result: symlinks and non-regular entries are
 * skipped, and every remaining file is accepted only when its *real* path is
 * inside the base directory. Asking the glob walk not to follow symlinked
 * directories (`followSymlinks: false`) is defence in depth on top of that,
 * not the guarantee — see the note on `listFilesWithinBase`.
 */

import { globSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";

declare const validatedRealPathBrand: unique symbol;

export type ValidatedRealPath = string & { readonly [validatedRealPathBrand]: true };

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
export function assertRealPathWithinBase(baseDir: string, candidate: string): ValidatedRealPath {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- caller-supplied base; the containment assertion is performed on the resolved results below (this call *is* the guard)
  const realBase = realpathSync(resolve(baseDir));
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- caller-supplied target; resolved here for the containment assertion immediately below
  const realTarget = realpathSync(resolve(candidate));

  if (!isWithinBase(realBase, realTarget)) {
    throw new Error(
      `Refusing to use path outside ${realBase}: ${realTarget} (resolved from ${resolve(candidate)})`,
    );
  }

  return realTarget as ValidatedRealPath;
}

/**
 * Read a UTF-8 file using a path already validated by `assertRealPathWithinBase`.
 *
 * @param path - A `ValidatedRealPath`; the brand can only be produced by the containment check
 */
export function readTextFileAtRealPath(path: ValidatedRealPath): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- the parameter's `ValidatedRealPath` brand is only producible by assertRealPathWithinBase
  return readFileSync(path, "utf-8");
}

/** Write a UTF-8 file using a path already validated by `assertRealPathWithinBase`. */
export function writeTextFileAtRealPath(path: ValidatedRealPath, content: string): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- the parameter's `ValidatedRealPath` brand is only producible by assertRealPathWithinBase
  writeFileSync(path, content, "utf-8");
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
 * Hardening (in order of what actually blocks an escape):
 *   - each result is re-checked with its real path, so neither a symlinked
 *     *file* nor a file reached through a symlinked *directory* can be returned
 *     if the link target sits outside the base directory. This is the binding
 *     control: it works on every Node release the scripts can run on.
 *   - symlinked entries and non-regular files are skipped
 *   - the glob is also asked to skip descending into symlinked directories
 *     (`followSymlinks: false`). Defence in depth only, and deliberately not
 *     relied on: `followSymlinks` is not supported by every Node line (Node 22
 *     ignores it and walks the link), so its absence fails open to the
 *     real-path re-check above, which still rejects the entries.
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
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- trusted base root supplied by the caller; used as the containment boundary for every result below
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
