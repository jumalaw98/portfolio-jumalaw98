import { describe, it, expect, vi, beforeEach } from "vitest";
import { X_TEXT_BUDGET } from "./constants";
import { getSummary } from "./getSummary";

// ── Hoisted mocks ───────────────────────────────────────────────────
// vi.hoisted runs before imports so the mock factories can reference
// the spy instances.

const { mockGemini, mockOpenRouter } = vi.hoisted(() => ({
  mockGemini: vi.fn(),
  mockOpenRouter: vi.fn(),
}));

vi.mock("./gemini", () => ({
  generateSummaryGemini: mockGemini,
}));

vi.mock("./openrouter", () => ({
  generateSummaryOpenRouter: mockOpenRouter,
}));

const BASE_INPUT = {
  frontmatter: {
    excerpt: "A fallback excerpt that is long enough to be useful.",
  },
  rawBody: "Some raw body text for the LLM to process.",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSummary — fallback chain", () => {
  // ── Tier 1: manual frontmatter hook ────────────────────────────────

  it("returns the manual summary.hook immediately without calling any API", async () => {
    const input = {
      ...BASE_INPUT,
      frontmatter: {
        ...BASE_INPUT.frontmatter,
        summary: { hook: "Manual hook text", body: "Manual body text" },
      },
    };

    const result = await getSummary(input);

    expect(result).toEqual({
      hook: "Manual hook text",
      body: "Manual body text",
    });
    expect(mockGemini).not.toHaveBeenCalled();
    expect(mockOpenRouter).not.toHaveBeenCalled();
  });

  it("returns summary.hook with null body when body is absent", async () => {
    const input = {
      ...BASE_INPUT,
      frontmatter: {
        ...BASE_INPUT.frontmatter,
        summary: { hook: "Hook only, no body" },
      },
    };

    const result = await getSummary(input);

    expect(result.hook).toBe("Hook only, no body");
    expect(result.body).toBeNull();
  });

  // ── Tier 2: Gemini succeeds → OpenRouter not called ────────────────

  it("calls Gemini when no manual hook is present and uses Gemini's result", async () => {
    mockGemini.mockResolvedValueOnce({
      hook: "Gemini generated hook",
      body: "Gemini body",
    });

    const result = await getSummary(BASE_INPUT);

    expect(mockGemini).toHaveBeenCalledTimes(1);
    expect(mockGemini).toHaveBeenCalledWith(BASE_INPUT.rawBody);
    expect(mockOpenRouter).not.toHaveBeenCalled();
    expect(result).toEqual({
      hook: "Gemini generated hook",
      body: "Gemini body",
    });
  });

  // ── Tier 3: Gemini fails → OpenRouter called → result used ────────

  it("calls OpenRouter when Gemini throws and uses OpenRouter's result", async () => {
    mockGemini.mockRejectedValueOnce(new Error("Gemini rate limited"));
    mockOpenRouter.mockResolvedValueOnce({
      hook: "OpenRouter generated hook",
      body: "OpenRouter body",
    });

    const result = await getSummary(BASE_INPUT);

    expect(mockGemini).toHaveBeenCalledTimes(1);
    expect(mockOpenRouter).toHaveBeenCalledTimes(1);
    expect(mockOpenRouter).toHaveBeenCalledWith(BASE_INPUT.rawBody);
    expect(result).toEqual({
      hook: "OpenRouter generated hook",
      body: "OpenRouter body",
    });
  });

  // ── Tier 4: Both fail → fallback to excerpt ────────────────────────

  it("falls back to excerpt when both Gemini and OpenRouter throw", async () => {
    mockGemini.mockRejectedValueOnce(new Error("Gemini down"));
    mockOpenRouter.mockRejectedValueOnce(new Error("OpenRouter quota exceeded"));

    const result = await getSummary(BASE_INPUT);

    expect(mockGemini).toHaveBeenCalledTimes(1);
    expect(mockOpenRouter).toHaveBeenCalledTimes(1);
    expect(result.hook).toBe(BASE_INPUT.frontmatter.excerpt);
    expect(result.body).toBeNull();
  });

  // ── The function never throws ──────────────────────────────────────

  it("never throws — returns excerpt even in catastrophic failure", async () => {
    mockGemini.mockRejectedValueOnce(new Error("Unexpected crash"));
    mockOpenRouter.mockRejectedValueOnce(new Error("Also crashed"));

    await expect(getSummary(BASE_INPUT)).resolves.toBeDefined();
  });

  // ── Hook is always truncated to X_TEXT_BUDGET ──────────────────────

  it("truncates a very long manual hook to X_TEXT_BUDGET characters", async () => {
    // Use a realistic multi-word string so truncateAtWordBoundary can cut at a space
    const words = Array.from({ length: 40 }, (_, i) => `word${i + 1}`);
    const veryLongHook = words.join(" ");
    expect(veryLongHook.length).toBeGreaterThan(X_TEXT_BUDGET);

    const input = {
      ...BASE_INPUT,
      frontmatter: {
        ...BASE_INPUT.frontmatter,
        summary: { hook: veryLongHook },
      },
    };

    const result = await getSummary(input);

    expect(result.hook.length).toBeLessThanOrEqual(X_TEXT_BUDGET);
    expect(result.hook).toMatch(/…$/);
  });

  it("truncates a very long Gemini hook to X_TEXT_BUDGET characters", async () => {
    const words = Array.from({ length: 40 }, (_, i) => `word${i + 1}`);
    const longHook = words.join(" ");

    mockGemini.mockResolvedValueOnce({
      hook: longHook,
      body: null,
    });

    const result = await getSummary(BASE_INPUT);

    expect(result.hook.length).toBeLessThanOrEqual(X_TEXT_BUDGET);
  });

  it("truncates a very long excerpt fallback to X_TEXT_BUDGET characters", async () => {
    mockGemini.mockRejectedValueOnce(new Error("Down"));
    mockOpenRouter.mockRejectedValueOnce(new Error("Down"));

    const words = Array.from({ length: 40 }, (_, i) => `word${i + 1}`);
    const longExcerpt = words.join(" ");

    const input = {
      frontmatter: { excerpt: longExcerpt },
      rawBody: "body",
    };

    const result = await getSummary(input);

    expect(result.hook.length).toBeLessThanOrEqual(X_TEXT_BUDGET);
  });

  // ── API call ordering ──────────────────────────────────────────────

  it("does not call OpenRouter if Gemini succeeded", async () => {
    mockGemini.mockResolvedValueOnce({
      hook: "Gemini hook",
      body: null,
    });
    mockOpenRouter.mockResolvedValueOnce({
      hook: "OR hook",
      body: null,
    });

    await getSummary(BASE_INPUT);

    expect(mockGemini).toHaveBeenCalledTimes(1);
    expect(mockOpenRouter).not.toHaveBeenCalled();
  });

  it("does not use excerpt if OpenRouter succeeded", async () => {
    mockGemini.mockRejectedValueOnce(new Error("Down"));
    mockOpenRouter.mockResolvedValueOnce({
      hook: "OR hook",
      body: null,
    });

    const result = await getSummary(BASE_INPUT);

    expect(mockOpenRouter).toHaveBeenCalledTimes(1);
    expect(result.hook).toBe("OR hook");
  });
});
