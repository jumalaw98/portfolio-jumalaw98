import { describe, it, expect } from "vitest";
import { validateWebhookUrl } from "@/lib/ssrf";

describe("validateWebhookUrl — SSRF prevention", () => {
  it("accepts a valid HTTPS URL", () => {
    const result = validateWebhookUrl("https://hooks.example.com/webhook");
    expect(result).toBeInstanceOf(URL);
    expect(result?.href).toBe("https://hooks.example.com/webhook");
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
  });

  it("rejects loopback IPs", () => {
    expect(validateWebhookUrl("https://127.0.0.1/api")).toBeNull();
    expect(validateWebhookUrl("https://[::1]/api")).toBeNull();
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

  it("rejects non-standard ports", () => {
    expect(validateWebhookUrl("https://example.com:8080/api")).toBeNull();
    expect(validateWebhookUrl("https://example.com:9999/api")).toBeNull();
  });

  it("accepts explicit port 443 (default HTTPS port)", () => {
    const result = validateWebhookUrl("https://example.com:443/api");
    expect(result).toBeInstanceOf(URL);
    // URL constructor normalizes :443 to empty string
    expect(result?.port).toBe("");
  });

  it("rejects data: URLs", () => {
    expect(validateWebhookUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects invalid URLs", () => {
    expect(validateWebhookUrl("not-a-url")).toBeNull();
    expect(validateWebhookUrl("")).toBeNull();
  });

  it("rejects DNS rebinding via nip.io", () => {
    expect(validateWebhookUrl("https://169.254.169.254.nip.io/api")).toBeNull();
    expect(validateWebhookUrl("https://169.254.169.254.nip.io:8080/api")).toBeNull();
  });

  it("rejects 0.0.0.0", () => {
    expect(validateWebhookUrl("https://0.0.0.0/api")).toBeNull();
  });

  it("rejects multicast addresses", () => {
    expect(validateWebhookUrl("https://224.0.0.1/api")).toBeNull();
    expect(validateWebhookUrl("https://239.255.255.250/api")).toBeNull();
  });
});
