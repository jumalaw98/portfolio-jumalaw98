/**
 * Generate a social-media summary hook using Google Gemini.
 *
 * Uses the `generateContent` REST endpoint with structured-output mode to
 * produce validated JSON.  See the research note in the module docstring
 * for the current recommended model — this was verified at implementation
 * time but model identifiers change independently of this code.
 */

const MODEL = "gemini-3.6-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Shape both LLM clients return. */
export interface SummaryResult {
  hook: string;
  body: string | null;
}

/**
 * Build the system prompt shared by both Gemini and OpenRouter.
 * Keeps the voice instruction in one place so changes apply to both.
 */
export function buildSummaryPrompt(postBody: string): string {
  return [
    "You are a technical writer helping Lawrence Juma (jumalaw98) create a social-media summary for a blog post.",
    "",
    "Voice: plain-spoken, outcome-first. Focus on practical takeaways and real results. Be direct and specific.",
    "Never invent numbers, claims, or quotes not present in the source text.",
    "",
    "Return ONLY valid JSON matching this shape — no markdown fences, no extra text:",
    '{"hook": string, "body": string | null}',
    "",
    "- `hook`: a single punchy sentence under 256 characters that makes someone want to click. Lead with the outcome.",
    "- `body`: optional 1–2 sentence elaboration. Use null if the hook is enough.",
    "",
    "Source blog post:",
    postBody,
  ].join("\n");
}

export async function generateSummaryGemini(
  postBody: string,
): Promise<SummaryResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is required. Set it in your environment or .env.local.",
    );
  }

  const url = `${API_BASE}/models/${MODEL}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: buildSummaryPrompt(postBody) }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
        // Use snake_case names for the v1beta REST API — camelCase fields
        // like `responseFormat` are silently ignored by the server.
        response_mime_type: "application/json",
        response_schema: {
          type: "object",
          properties: {
            hook: { type: "string" },
            body: { type: "string" },
          },
          required: ["hook", "body"],
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const json = await response.json();
  return parseGeminiResponse(json);
}

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string; functionCall?: { args?: string } }>;
  };
}

function parseGeminiResponse(raw: unknown): SummaryResult {
  try {
    // Navigate the Gemini response envelope
    const data = raw as { candidates?: GeminiCandidate[] };
    const candidate = data.candidates?.[0];
    const text =
      candidate?.content?.parts?.[0]?.text ??
      candidate?.content?.parts?.[0]?.functionCall?.args ??
      "";

    if (!text) {
      throw new Error("Empty response from Gemini — no text in response");
    }

    // Strip markdown code fences if the model wrapped the JSON
    const cleaned = (text as string)
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
      `Failed to parse Gemini response: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
