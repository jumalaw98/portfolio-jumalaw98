import { spawnSync } from "node:child_process";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const isFix = args.includes("--fix");

console.log(isFix ? "Fixing formatting and linting..." : "Checking formatting and linting...");

const prettierPath = path.resolve(__dirname, "../node_modules/prettier/bin/prettier.cjs");
const eslintPath = path.resolve(__dirname, "../node_modules/eslint/bin/eslint.js");

const prettierArgs = [prettierPath, isFix ? "--write" : "--check", "."];
console.log(`Running: node prettier ${prettierArgs.slice(1).join(" ")}`);
const prettierResult = spawnSync(process.execPath, prettierArgs, { stdio: "inherit" });

const eslintArgs = [eslintPath, ...(isFix ? ["--fix", "."] : ["."])];
console.log(`Running: node eslint ${eslintArgs.slice(1).join(" ")}`);
const eslintResult = spawnSync(process.execPath, eslintArgs, { stdio: "inherit" });

if (prettierResult.status !== 0 || eslintResult.status !== 0) {
  process.exit(1);
}
