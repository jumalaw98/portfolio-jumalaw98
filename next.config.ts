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

export default nextConfig;
