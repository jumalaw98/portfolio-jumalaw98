import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishToDevto } from "./publish-devto";

describe("publishToDevto", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as unknown as typeof globalThis.fetch;
  });

  const baseInput = {
    title: "Test Article",
    bodyMarkdown: "This is the body content",
    tags: ["javascript", "webdev"],
    description: "A test article description",
    canonicalUrl: "https://jumalaw98.vercel.app/blog/test-article",
    apiKey: "test-api-key-123",
  };

  it("sends POST request to dev.to API when devToId is not provided and no matching article exists", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 99, url: "https://dev.to/article-99" }),
      });

    await publishToDevto(baseInput);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://dev.to/api/articles/me/all?per_page=1000");
    expect(fetchMock.mock.calls[1][0]).toBe("https://dev.to/api/articles");
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ method: "POST" }));

    const callBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(callBody.article.title).toBe("Test Article");
    expect(callBody.article.body_markdown).toBe("This is the body content");
    expect(callBody.article.tags).toEqual(["javascript", "webdev"]);
    expect(callBody.article.canonical_url).toBe("https://jumalaw98.vercel.app/blog/test-article");
    expect(callBody.article.published).toBe(true);
  });

  it("sends PUT request to existing article when devToId is not provided but canonicalUrl matches an existing article", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 88, canonical_url: "https://jumalaw98.vercel.app/blog/test-article/" },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 88, url: "https://dev.to/article-88" }),
      });

    const result = await publishToDevto(baseInput);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://dev.to/api/articles/me/all?per_page=1000");
    expect(fetchMock.mock.calls[1][0]).toBe("https://dev.to/api/articles/88");
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ method: "PUT" }));
    expect(result).toEqual({
      id: 88,
      url: "https://dev.to/article-88",
      isUpdate: true,
    });
  });

  it("sends PUT request directly to dev.to API when devToId is provided without querying me/all", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ id: 42, url: "https://dev.to/article-42" }),
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    await publishToDevto({ ...baseInput, devToId: 42 });

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev.to/api/articles/42",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(fetchMock.mock.calls[0][1].headers).toHaveProperty("api-key", "test-api-key-123");

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(callBody.article.canonical_url).toBe("https://jumalaw98.vercel.app/blog/test-article");
    expect(callBody.article.published).toBe(true);
  });

  it("returns PublishResult with id, url, and isUpdate=false for new article", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 99, url: "https://dev.to/article-99" }),
      });

    const result = await publishToDevto(baseInput);

    expect(result).toEqual({
      id: 99,
      url: "https://dev.to/article-99",
      isUpdate: false,
    });
  });

  it("returns isUpdate=true when devToId is provided", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ id: 42, url: "https://dev.to/article-42" }),
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await publishToDevto({ ...baseInput, devToId: 42 });

    expect(result).toEqual({
      id: 42,
      url: "https://dev.to/article-42",
      isUpdate: true,
    });
  });

  it("includes canonical_url with /blog/ and the slug", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 99, url: "https://dev.to/article" }),
      });

    await publishToDevto({
      ...baseInput,
      canonicalUrl: "https://jumalaw98.vercel.app/blog/my-custom-slug",
    });

    const callBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(callBody.article.canonical_url).toContain("/blog/");
    expect(callBody.article.canonical_url).toContain("my-custom-slug");
  });

  it("throws an error with status code and body when API returns non-ok response", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized: invalid API key",
      });

    await expect(publishToDevto(baseInput)).rejects.toThrow(
      "dev.to API error (401): Unauthorized: invalid API key",
    );
  });

  it("throws an error on 500 response with error body", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal server error occurred",
      });

    await expect(publishToDevto(baseInput)).rejects.toThrow(
      "dev.to API error (500): Internal server error occurred",
    );
  });

  it("aborts without creating an article when canonical URL lookup returns non-ok response", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => "Service unavailable",
    });

    await expect(publishToDevto(baseInput)).rejects.toThrow(
      "dev.to idempotency lookup failed (503): Service unavailable",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("aborts without creating an article when canonical URL lookup fails", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("Network unavailable"));

    await expect(publishToDevto(baseInput)).rejects.toThrow("Network unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
