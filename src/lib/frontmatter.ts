import * as yaml from "js-yaml";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function parseFrontmatterObject(rawYaml: string): Record<string, unknown> {
  const value = yaml.load(rawYaml, {
    schema: yaml.JSON_SCHEMA,
  });

  if (!isPlainObject(value)) {
    throw new Error("Frontmatter YAML must resolve to a plain object.");
  }

  return value;
}

/**
 * Serialise a scalar for a frontmatter line.
 *
 * Numbers stay unquoted (the parser uses `JSON_SCHEMA`, where a quoted value is
 * a string — `devToId: "42"` would silently stop being numeric); strings are
 * double-quoted with backslashes and quotes escaped, which is valid JSON/YAML
 * for every input.
 */
function serializeYamlScalar(value: string | number): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Refusing to write non-finite frontmatter value: ${String(value)}`);
    }
    return String(value);
  }
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

/**
 * Set a single scalar field in an MDX document's frontmatter, leaving the body
 * and every other line byte-for-byte untouched.
 *
 * The publishing scripts use this to persist the identifiers returned by
 * external services (`devToId`, `bufferPostedAt`). It replaces the previous
 * hand-rolled version, which located a line with `findIndex()` and wrote it
 * back with `lines[index] = …`; that dynamic index assignment is an
 * "object injection sink" pattern, and it relied on the index staying in range
 * while other lines were appended.
 *
 * @param content - Full MDX file contents
 * @param field - Frontmatter key, e.g. `devToId` (used as a literal prefix)
 * @param value - Scalar value to store
 * @returns Updated contents, or `null` when the frontmatter block is missing or
 *          was not rewritten (callers treat that as a hard failure)
 */
export function upsertFrontmatterField(
  content: string,
  field: string,
  value: string | number,
): string | null {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(field)) {
    throw new Error(`Refusing to write unsafe frontmatter key: ${JSON.stringify(field)}`);
  }

  const parts = content.split(/^---$/m);
  // 0 = before the opening delimiter, 1 = frontmatter, 2.. = body
  if (parts.length < 3) return null;

  const prefix = `${field}:`;
  const nextLine = `${field}: ${serializeYamlScalar(value)}`;

  const lines = parts[1].trim().split("\n");
  const hasField = lines.some((line) => line.startsWith(prefix));
  const updatedLines = hasField
    ? lines.map((line) => (line.startsWith(prefix) ? nextLine : line))
    : [...lines, nextLine];

  const updatedFrontmatter = updatedLines.join("\n");
  const updatedParts = [...parts];
  updatedParts[1] = `\n${updatedFrontmatter}\n`;

  const updatedContent = updatedParts.join("---");

  // Guard the previous silent no-op: callers must be able to abort the run
  // rather than report success while the file on disk is unchanged.
  return updatedContent === content ? null : updatedContent;
}

