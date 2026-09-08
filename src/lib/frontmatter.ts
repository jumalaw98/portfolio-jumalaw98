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
    json: true,
  });

  if (!isPlainObject(value)) {
    throw new Error("Frontmatter YAML must resolve to a plain object.");
  }

  return value;
}
