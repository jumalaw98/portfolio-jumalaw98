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

  // The pattern alone accepts shorthand numeric hosts such as `127.1`, but the
  // URL parser rewrites them into loopback literals (https://127.1/ → 127.0.0.1)
  // that `isBlockedHostname` only recognises in their expanded form.
  it("blocks shorthand numeric hosts that the URL parser expands to loopback", async () => {
    const { fetchHashnodeRss } = await load();

    for (const host of ["127.1", "0177.0.0.1", "0300.0250.0.1", "127.0.1"]) {
      const result = await fetchHashnodeRss(host);
      expect(result).toMatchObject({ ok: false, reason: "fetch_failed" });
      if (!result.ok) expect(result.error).toContain("Blocked unsafe");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks private destinations hidden behind wildcard-DNS aliases", async () => {
    const { fetchHashnodeRss } = await load();

    for (const host of [
      "127.0.0.1.nip.io",
      "10.0.0.1.sslip.io",
      "169.254.169.254.nip.io",
      "7f000001.nip.io",
      "127-0-0-1.nip.io",
      "192-168-0-1.example.com",
    ]) {
      const result = await fetchHashnodeRss(host);
      expect(result).toMatchObject({ ok: false, reason: "fetch_failed" });
      if (!result.ok) expect(result.error).toContain("Blocked unsafe");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not follow redirects to a non-allowlisted host", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 302,
      headers: new Headers({ location: "https://evil.example.org/rss.xml" }),
      text: async () => "",
    });
    const { fetchHashnodeRss } = await load();

    const result = await fetchHashnodeRss(CONFIGURED_HOST);

    expect(result).toMatchObject({ ok: false, reason: "fetch_failed" });
    if (!result.ok) expect(result.error).toContain("redirect");
    // Only the original request was issued — the redirect target was never fetched.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
  });

  it("does not follow redirects to a private or loopback destination", async () => {
    for (const location of [
      "https://127.0.0.1/rss.xml",
      "https://localhost/rss.xml",
      "https://169.254.169.254/latest/meta-data/",
      "https://127.0.0.1.nip.io/rss.xml",
    ]) {
      fetchMock.mockReset();
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 301,
        headers: new Headers({ location }),
        text: async () => "",
      });
      const { fetchHashnodeRss } = await load();

      const result = await fetchHashnodeRss(CONFIGURED_HOST);

      expect(result).toMatchObject({ ok: false, reason: "fetch_failed" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it("follows a redirect that stays on the allowlisted host", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 301,
        headers: new Headers({ location: "https://blog.example.com/feed/rss.xml" }),
        text: async () => "",
      })
      .mockResolvedValueOnce({ ok: true, text: async () => "<rss>followed</rss>" });
    const { fetchHashnodeRss } = await load();

    const result = await fetchHashnodeRss(CONFIGURED_HOST);

    expect(result).toEqual({ ok: true, data: "<rss>followed</rss>" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("https://blog.example.com/feed/rss.xml");
  });

  it("stops after too many redirects", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 302,
      headers: new Headers({ location: "https://blog.example.com/rss.xml" }),
      text: async () => "",
    });
    const { fetchHashnodeRss } = await load();

    const result = await fetchHashnodeRss(CONFIGURED_HOST);

    expect(result).toMatchObject({ ok: false, reason: "fetch_failed" });
    if (!result.ok) expect(result.error).toContain("redirect");
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(4);
  });
});
