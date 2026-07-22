import type { NextConfig } from "next";

// ─── Velite content build (runs once per process) ───────────────────────────
// Build function pattern — the recommended approach for Turbopack compatibility.
// Runs during Next.js config evaluation, generating .velite/ before pages compile.
const runningVeliteDev = process.argv.includes("dev");
const runningVeliteBuild = process.argv.includes("build");
if (!process.env.VELITE_STARTED && (runningVeliteDev || runningVeliteBuild)) {
  process.env.VELITE_STARTED = "1";
  // Use promise chain (not top-level await) — Next.js config loader does
  // not support top-level await in TypeScript config files.
  import("velite").then((m) => m.build({ watch: runningVeliteDev, clean: !runningVeliteDev }));
}

// ─── Content Security Policy ─────────────────────────────────────────────────
// Pragmatic policy for a portfolio site. 'unsafe-inline' is required for
// Next.js hydration scripts, framer-motion inline styles, and Google Fonts
// loader. 'unsafe-eval' is only added in development (Next.js hot-reload
// requires it); production omits it to block eval-based script gadgets.
// Adopt nonce-based CSP via middleware if the threat model demands it.
const isDev = process.env.NODE_ENV === "development";
const scriptSrc = isDev
  ? `script-src 'self' 'unsafe-eval' 'unsafe-inline'`
  : `script-src 'self' 'unsafe-inline'`;

const CSP = [
  `default-src 'self'`,
  scriptSrc,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: https://images.unsplash.com https://ik.imagekit.io https://cdn.hashnode.com blob:`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `connect-src 'self' https://api.resend.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join("; ");

const nextConfig: NextConfig = {
  // ── Server hardening ───────────────────────────────────────────────────
  poweredByHeader: false,

  // ── Build hardening ────────────────────────────────────────────────────
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "cdn.hashnode.com",
      },
    ],
  },

  // ── HTTP security headers ──────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Privacy-preserving referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable unused browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Enforce HTTPS for one year (Vercel serves all traffic over HTTPS)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Control cross-origin isolation (allow-popups so social links work)
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          // Mitigate XSS & data-injection attacks
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/resume",
        destination: "/about#resume",
        permanent: true,
      },
    ];
  },
};

// Bundle analyzer — run with: ANALYZE=true npm run analyze
// Generates three HTML reports (client, edge, server) in .next/analyze/
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

export default withBundleAnalyzer(nextConfig);
