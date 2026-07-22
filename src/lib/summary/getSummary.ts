/**
 * Orchestrate the summary fallback chain.
 *
 * Order: (1) manual frontmatter hook → (2) Gemini → (3) OpenRouter → (4) excerpt
 *
 * This function **never throws** — every code path returns a valid
 * `{ hook, body }` pair.  If both LLM APIs fail, the post's excerpt is used
 * as a last-resort hook.
 */

import { generateSummaryGemini } from "./gemini";
import { generateSummaryOpenRouter } from "./openrouter";
import { truncateAtWordBoundary } from "./truncate";
import { X_TEXT_BUDGET } from "./constants";
import type { SummaryResult } from "./gemini";

interface GetSummaryInput {
  frontmatter: {
    summary?: {
      hook?: string;
      body?: string;
    };
    excerpt: string;
  };
  rawBody: string;
}

/**
 * Resolve a summary for the given post, never throwing.
 *
 * The returned `hook` is always truncated to `X_TEXT_BUDGET` characters at a
 * word boundary, regardless of which tier produced it.
 */
export async function getSummary(input: GetSummaryInput): Promise<SummaryResult> {
  try {
    return await resolveSummary(input);
  } catch {
    // Absolute last resort — should not be reachable since the fallback chain
    // itself should never throw, but a defensive catch prevents surprises.
    return {
      hook: truncateAtWordBoundary(input.frontmatter.excerpt, X_TEXT_BUDGET),
      body: null,
    };
  }
}

async function resolveSummary(input: GetSummaryInput): Promise<SummaryResult> {
  const { summary, excerpt } = input.frontmatter;

  // Tier 1 — manual frontmatter hook
  if (summary?.hook) {
    return {
      hook: truncateAtWordBoundary(summary.hook, X_TEXT_BUDGET),
      body: summary.body ?? null,
    };
  }

  // Tier 2 — Gemini
  try {
    const result = await generateSummaryGemini(input.rawBody);
    return {
      hook: truncateAtWordBoundary(result.hook, X_TEXT_BUDGET),
      body: result.body,
    };
  } catch (err) {
    console.warn(
      "Gemini summary failed, falling back to OpenRouter:",
      err instanceof Error ? err.message : err,
    );
  }

  // Tier 3 — OpenRouter
  try {
    const result = await generateSummaryOpenRouter(input.rawBody);
    return {
      hook: truncateAtWordBoundary(result.hook, X_TEXT_BUDGET),
      body: result.body,
    };
  } catch (err) {
    console.warn(
      "OpenRouter summary failed, falling back to excerpt:",
      err instanceof Error ? err.message : err,
    );
  }

  // Tier 4 — excerpt fallback
  // Guard against an empty excerpt producing an empty hook.
  const fallbackText = excerpt || "New blog post from Lawrence Juma";
  return {
    hook: truncateAtWordBoundary(fallbackText, X_TEXT_BUDGET),
    body: null,
  };
}
