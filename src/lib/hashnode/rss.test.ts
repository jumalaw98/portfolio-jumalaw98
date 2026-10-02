import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * SSRF regression tests for the outbound RSS fetcher.
 *
 * `fetchHashnodeRss` must only ever contact a host that is both a valid
 * public hostname and present on the egress allowlist — and a rejected host
 * must fail before `fetch` is invoked, not after.
 */
describe("fetchHashnodeRss — SSRF guard", () => {
  const originalEnv = process.env;
  const fetchMock = vi.fn();

  const CONFIGURED_HOST = "blog.example.com";

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      HASHNODE_PUBLICATION_HOST: CONFIGURED_HOST,
    };
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  const load = () => import("./rss");

  it("reports not_configured when no host is given", async () => {
    const { fetchHashnodeRss } = await load();

    const result = await fetchHashnodeRss("");

    expect(result).toMatchObject({ ok: false, reason: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches the configured publication host", async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => "<rss>feed</rss>" });
    const { fetchHashnodeRss } = await load();

    const result = await fetchHashnodeRss(CONFIGURED_HOST);

    expect(result).toEqual({ ok: true, data: "<rss>feed</rss>" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`https://${CONFIGURED_HOST}/rss.xml`);
  });

  it("normalizes operator-friendly host values before allowlisting", async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => "<rss/>" });
    const { fetchHashnodeRss } = await load();

    const result = await fetchHashnodeRss(`  https://${CONFIGURED_HOST.toUpperCase()}/  `);

    expect(result.ok).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(`https://${CONFIGURED_HOST}/rss.xml`);
  });

  it("refuses hosts that are not on the allowlist without fetching", async () => {
    const { fetchHashnodeRss } = await load();

    const result = await fetchHashnodeRss("other-feed.example.org");

    expect(result).toMatchObject({ ok: false, reason: "fetch_failed" });
    if (!result.ok) expect(result.error).toContain("allowlist");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks local, private, and cloud-metadata targets before the allowlist check", async () => {
    const { fetchHashnodeRss } = await load();

    for (const host of [
      "127.0.0.1",
      "169.254.169.254",
      "internal.localhost",
      "metadata.google.internal",
      "10.0.0.5",
    ]) {
      const result = await fetchHashnodeRss(host);
      expect(result).toMatchObject({ ok: false, reason: "fetch_failed" });
      if (!result.ok) expect(result.error).toContain("Blocked unsafe");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects hosts carrying an injected scheme, path, port, or credentials", async () => {
    const { fetchHashnodeRss } = await load();

    for (const host of [
      `${CONFIGURED_HOST}/../../admin`,
      `${CONFIGURED_HOST}:8443`,
      `user@${CONFIGURED_HOST}`,
      "file:///etc/passwd",
    ]) {
      const result = await fetchHashnodeRss(host);
      expect(result).toMatchObject({ ok: false, reason: "fetch_failed" });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
