import { describe, it, expect } from "vitest";
import { validateWebhookUrl } from "@/lib/ssrf";

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

  it("rejects CGNAT shared address space (100.64.0.0/10)", () => {
    expect(validateWebhookUrl("https://100.64.0.1/api")).toBeNull();
    expect(validateWebhookUrl("https://100.127.255.255/api")).toBeNull();
  });

  it("rejects benchmarking range (198.18.0.0/15)", () => {
    expect(validateWebhookUrl("https://198.18.0.1/api")).toBeNull();
    expect(validateWebhookUrl("https://198.19.255.255/api")).toBeNull();
  });

  it("rejects documentation ranges (198.51.100.0/24, 203.0.113.0/24)", () => {
    expect(validateWebhookUrl("https://198.51.100.1/api")).toBeNull();
    expect(validateWebhookUrl("https://203.0.113.1/api")).toBeNull();
  });

  it("rejects IETF protocol assignments (192.0.0.0/24)", () => {
    expect(validateWebhookUrl("https://192.0.0.1/api")).toBeNull();
  });

  it("rejects reserved addresses (240.0.0.0/4)", () => {
    expect(validateWebhookUrl("https://240.0.0.1/api")).toBeNull();
    expect(validateWebhookUrl("https://255.255.255.255/api")).toBeNull();
  });

  it("rejects IPv6 unique local addresses (fc00::/7)", () => {
    expect(validateWebhookUrl("https://[fc00::1]/api")).toBeNull();
    expect(validateWebhookUrl("https://[fd00::1]/api")).toBeNull();
    expect(validateWebhookUrl("https://[fcff:ffff:ffff:ffff:ffff:ffff:ffff:ffff]/api")).toBeNull();
  });
});
