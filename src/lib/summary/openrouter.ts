/**
 * Generate a social-media summary hook using OpenRouter (free-tier model).
 *
 * Uses the `/v1/chat/completions` endpoint with the current recommended
 * free text-generation model.  The `:free` suffix is appended to route the
 * request through OpenRouter's free tier — this is subject to their per-minute
 * and per-day rate limits (20 RPM, 50 RPD without credits as of July 2026).
 */

import { buildSummaryPrompt, type SummaryResult } from "./gemini";

const MODEL = "google/gemma-4-31b-it:free";
const API_BASE = "https://openrouter.ai/api/v1";

export async function generateSummaryOpenRouter(postBody: string): Promise<SummaryResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required. Set it in your environment or .env.local.");
  }

  const url = `${API_BASE}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: buildSummaryPrompt(postBody) }],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const json = await response.json();
  return parseOpenRouterResponse(json);
}

interface OpenRouterChoice {
  message?: { content?: string };
  delta?: { content?: string };
}

function parseOpenRouterResponse(raw: unknown): SummaryResult {
  try {
    const data = raw as { choices?: OpenRouterChoice[] };
    const choice = data.choices?.[0];
    const content: string = choice?.message?.content ?? choice?.delta?.content ?? "";

    if (!content) {
      throw new Error("Empty response from OpenRouter — no content in choice");
    }

    // Strip markdown code fences if present
    const cleaned = content
      .replace(/^```(?:json)?\s*/gm, "")
      .replace(/```\s*$/gm, "")
      .trim();

    const parsed = JSON.parse(cleaned) as SummaryResult;
    return {
      hook: typeof parsed.hook === "string" ? parsed.hook : "",
      body: typeof parsed.body === "string" ? parsed.body : null,
    };
  } catch (err) {
    throw new Error(
      `Failed to parse OpenRouter response: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
