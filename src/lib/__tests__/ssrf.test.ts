import { describe, it, expect } from "vitest";
import { isBlockedHostname, isPrivateIPv4, isPrivateIPv6, validateWebhookUrl } from "@/lib/ssrf";

describe("validateWebhookUrl — SSRF prevention", () => {
  it("accepts a valid HTTPS URL", () => {
    const result = validateWebhookUrl("https://hooks.slack.com/services/test");
    expect(result).toBeInstanceOf(URL);
    expect(result?.href).toBe("https://hooks.slack.com/services/test");
  });

  it("rejects HTTP URLs", () => {
    expect(validateWebhookUrl("http://hooks.example.com/webhook")).toBeNull();
  });

  it("rejects ftp:// URLs", () => {
    expect(validateWebhookUrl("ftp://hooks.example.com/webhook")).toBeNull();
  });

  it("rejects javascript: URLs", () => {
    expect(validateWebhookUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects localhost", () => {
    expect(validateWebhookUrl("https://localhost/api")).toBeNull();
    expect(validateWebhookUrl("https://sub.localhost/api")).toBeNull();
    expect(validateWebhookUrl("https://localhost./api")).toBeNull();
    expect(validateWebhookUrl("https://sub.localhost./api")).toBeNull();
  });

  it("rejects loopback IPs", () => {
    expect(validateWebhookUrl("https://127.0.0.1/api")).toBeNull();
    expect(validateWebhookUrl("https://[::1]/api")).toBeNull();
  });

  it("rejects private, link-local, multicast, and mapped IPv6 literals", () => {
    for (const address of [
      "fc00::1",
      "fd00::1",
      "fe80::1",
      "febf::1",
      "ff00::1",
      "::ffff:127.0.0.1",
      "::ffff:192.168.0.1",
    ]) {
      expect(validateWebhookUrl(`https://[${address}]/api`)).toBeNull();
    }
  });

  it("allows only supported webhook provider destinations", () => {
    expect(validateWebhookUrl("https://example.com/webhook")).toBeNull();
    expect(validateWebhookUrl("https://discord.com/api/webhooks/123/token")).toBeInstanceOf(URL);
    expect(validateWebhookUrl("https://discord.com/not-a-webhook")).toBeNull();
  });

  it("rejects private IPv4 ranges (10.x)", () => {
    expect(validateWebhookUrl("https://10.0.0.1/api")).toBeNull();
    expect(validateWebhookUrl("https://10.255.255.255/api")).toBeNull();
  });

  it("rejects private IPv4 ranges (172.16-31.x)", () => {
    expect(validateWebhookUrl("https://172.16.0.1/api")).toBeNull();
    expect(validateWebhookUrl("https://172.31.255.255/api")).toBeNull();
  });

  it("rejects private IPv4 ranges (192.168.x)", () => {
    expect(validateWebhookUrl("https://192.168.1.1/api")).toBeNull();
  });

  it("rejects link-local addresses (169.254.x)", () => {
    expect(validateWebhookUrl("https://169.254.169.254/api")).toBeNull();
    expect(validateWebhookUrl("https://169.254.0.1/api")).toBeNull();
  });

  it("rejects cloud metadata endpoints", () => {
    expect(validateWebhookUrl("https://169.254.169.254/latest/meta-data/")).toBeNull();
    expect(validateWebhookUrl("https://metadata.google.internal/computeMetadata/")).toBeNull();
  });

  it("rejects non-standard ports on allowlisted hosts", () => {
    expect(validateWebhookUrl("https://hooks.slack.com:8080/services/test")).toBeNull();
    expect(validateWebhookUrl("https://hooks.slack.com:9999/services/test")).toBeNull();
  });

  it("accepts explicit port 443 (default HTTPS port)", () => {
    const result = validateWebhookUrl("https://hooks.slack.com:443/services/test");
    expect(result).toBeInstanceOf(URL);
    // URL constructor normalizes :443 to empty string
    expect(result?.port).toBe("");
  });

  it("rejects data: URLs", () => {
    expect(validateWebhookUrl("data:text/html,test")).toBeNull();
  });

  it("rejects invalid URLs", () => {
    expect(validateWebhookUrl("not-a-url")).toBeNull();
    expect(validateWebhookUrl("")).toBeNull();
  });

  it("rejects DNS rebinding via nip.io", () => {
    expect(validateWebhookUrl("https://169.254.169.254.nip.io/api")).toBeNull();
    expect(validateWebhookUrl("https://metadata.169.254.169.254.nip.io/api")).toBeNull();
    expect(validateWebhookUrl("https://169.254.169.254.nip.io:8080/api")).toBeNull();
  });

  it("rejects 0.0.0.0", () => {
    expect(validateWebhookUrl("https://0.0.0.0/api")).toBeNull();
  });

  it("rejects multicast addresses", () => {
    expect(validateWebhookUrl("https://224.0.0.1/api")).toBeNull();
    expect(validateWebhookUrl("https://239.255.255.250/api")).toBeNull();
  });

  it("detects reserved IPv4 ranges directly", () => {
    expect(isPrivateIPv4("100.64.0.1")).toBe(true);
    expect(isPrivateIPv4("100.127.255.255")).toBe(true);
    expect(isPrivateIPv4("198.18.0.1")).toBe(true);
    expect(isPrivateIPv4("198.19.255.255")).toBe(true);
    expect(isPrivateIPv4("198.51.100.1")).toBe(true);
    expect(isPrivateIPv4("203.0.113.1")).toBe(true);
    expect(isPrivateIPv4("192.0.0.1")).toBe(true);
    expect(isPrivateIPv4("240.0.0.1")).toBe(true);
    expect(isPrivateIPv4("255.255.255.255")).toBe(true);
  });

  it("detects reserved IPv6 ranges directly", () => {
    expect(isPrivateIPv6("fc00::1")).toBe(true);
    expect(isPrivateIPv6("fd00::1")).toBe(true);
    expect(isPrivateIPv6("fe80::1")).toBe(true);
    expect(isPrivateIPv6("fcff:ffff:ffff:ffff:ffff:ffff:ffff:ffff")).toBe(true);
    expect(isPrivateIPv6("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateIPv6("::ffff:192.168.0.1")).toBe(true);
  });
});

describe("isBlockedHostname — wildcard-DNS aliases", () => {
  it("blocks aliases that encode a loopback address", () => {
    expect(isBlockedHostname("127.0.0.1.nip.io")).toBe(true);
    expect(isBlockedHostname("127.0.0.1.sslip.io")).toBe(true);
    expect(isBlockedHostname("127.0.0.1.nip.xx")).toBe(true);
    expect(isBlockedHostname("127.0.0.1.localtest.me")).toBe(true);
    expect(isBlockedHostname("127.0.0.1.lvh.me")).toBe(true);
  });

  it("blocks aliases that encode a private or link-local address", () => {
    expect(isBlockedHostname("10.0.0.1.nip.io")).toBe(true);
    expect(isBlockedHostname("192.168.1.1.sslip.io")).toBe(true);
    expect(isBlockedHostname("172.16.0.5.nip.io")).toBe(true);
    expect(isBlockedHostname("169.254.169.254.sslip.io")).toBe(true);
  });

  it("blocks dash-joined address aliases", () => {
    expect(isBlockedHostname("127-0-0-1.nip.io")).toBe(true);
    expect(isBlockedHostname("192-168-0-1.example.com")).toBe(true);
    expect(isBlockedHostname("10-0-0-1.sslip.io")).toBe(true);
  });

  it("blocks hex-encoded address aliases under wildcard DNS", () => {
    // 7f000001 → 127.0.0.1, 0a000001 → 10.0.0.1, a9fea9fe → 169.254.169.254
    expect(isBlockedHostname("7f000001.nip.io")).toBe(true);
    expect(isBlockedHostname("0a000001.nip.io")).toBe(true);
    expect(isBlockedHostname("a9fea9fe.nip.io")).toBe(true);
  });

  it("does not block public addresses or ordinary hostnames", () => {
    expect(isBlockedHostname("8.8.8.8.nip.io")).toBe(false);
    expect(isBlockedHostname("jumalaw98.hashnode.dev")).toBe(false);
    expect(isBlockedHostname("blog.example.com")).toBe(false);
    // Hex-looking labels on an ordinary domain must not be decoded.
    expect(isBlockedHostname("7f000001.example.com")).toBe(false);
    expect(isBlockedHostname("cafe.example.com")).toBe(false);
  });

  it("applies the alias check to the webhook validator too", () => {
    expect(validateWebhookUrl("https://127.0.0.1.nip.io/api")).toBeNull();
  });
});
