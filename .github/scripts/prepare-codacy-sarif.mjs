import { readFileSync, renameSync, writeFileSync } from "node:fs";

const [sarifFile] = process.argv.slice(2);

if (!sarifFile) {
  throw new Error("Usage: node prepare-codacy-sarif.mjs <sarif-file>");
}

const sarif = JSON.parse(readFileSync(sarifFile, "utf8"));

if (!Array.isArray(sarif.runs)) {
  throw new Error("The SARIF file does not contain a runs array.");
}

function categorySegment(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tool"
  );
}

function normalizeArtifactUris(value) {
  if (Array.isArray(value)) {
    value.forEach(normalizeArtifactUris);
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  if (value.artifactLocation && typeof value.artifactLocation.uri === "string") {
    value.artifactLocation.uri = value.artifactLocation.uri
      .replaceAll("[", "%5B")
      .replaceAll("]", "%5D");
  }

  if (value.location && typeof value.location.uri === "string") {
    value.location.uri = value.location.uri.replaceAll("[", "%5B").replaceAll("]", "%5D");
  }

  Object.values(value).forEach(normalizeArtifactUris);
}

sarif.runs.forEach((run, index) => {
  const toolName = categorySegment(run.tool?.driver?.name ?? "tool");

  // GitHub Code Scanning rejects one SARIF file that contains multiple runs
  // with the same tool and category. The trailing slash makes this value a
  // category (rather than a run ID), and the index keeps every run distinct.
  run.automationDetails = {
    ...run.automationDetails,
    id: `codacy/${toolName}-${index + 1}/`,
  };

  normalizeArtifactUris(run);
});

const temporaryFile = `${sarifFile}.tmp`;
writeFileSync(temporaryFile, `${JSON.stringify(sarif)}\n`);
renameSync(temporaryFile, sarifFile);

console.log(`Prepared ${sarif.runs.length} Codacy SARIF runs for GitHub upload.`);
