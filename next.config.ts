import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Placeholder imagery only — swap for real assets in /public before launch.
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        // Hashnode cover images served from its CDN (used by the RSS feed's
        // <enclosure> element). Required for next/image to load live covers.
        protocol: "https",
        hostname: "cdn.hashnode.com",
      },
    ],
  },
  async redirects() {
    return [
      // Resume was merged into the About page as of this change — see
      // app/about/page.tsx (id="resume") and README for details.
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
