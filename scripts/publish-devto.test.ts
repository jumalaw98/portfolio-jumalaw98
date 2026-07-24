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

  it("sends POST request to dev.to API when devToId is not provided", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ id: 99, url: "https://dev.to/article-99" }),
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    await publishToDevto(baseInput);

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev.to/api/articles",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock.mock.calls[0][1].headers).toHaveProperty("api-key", "test-api-key-123");

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(callBody.article.title).toBe("Test Article");
    expect(callBody.article.body_markdown).toBe("This is the body content");
    expect(callBody.article.tags).toEqual(["javascript", "webdev"]);
    expect(callBody.article.canonical_url).toBe("https://jumalaw98.vercel.app/blog/test-article");
    expect(callBody.article.published).toBe(true);
  });

  it("sends PUT request to dev.to API when devToId is provided", async () => {
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
    const mockResponse = {
      ok: true,
      json: async () => ({ id: 99, url: "https://dev.to/article-99" }),
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

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
    const mockResponse = {
      ok: true,
      json: async () => ({ id: 99, url: "https://dev.to/article" }),
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    await publishToDevto({
      ...baseInput,
      canonicalUrl: "https://jumalaw98.vercel.app/blog/my-custom-slug",
    });

    const callBody = JSON.parse(
      ((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit)
        .body as string,
    );
    expect(callBody.article.canonical_url).toContain("/blog/");
    expect(callBody.article.canonical_url).toContain("my-custom-slug");
  });

  it("throws an error with status code and body when API returns non-ok response", async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      text: async () => "Unauthorized: invalid API key",
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    await expect(publishToDevto(baseInput)).rejects.toThrow(/401/);
    await expect(publishToDevto(baseInput)).rejects.toThrow(/Unauthorized/);
  });

  it("throws an error on 500 response with error body", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      text: async () => "Internal server error occurred",
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    await expect(publishToDevto(baseInput)).rejects.toThrow(/500/);
    await expect(publishToDevto(baseInput)).rejects.toThrow(/Internal server error/);
  });
});
