import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Full Next.js server on Vercel. Route Handlers under app/api
  // proxy /api/* to the backend so auth cookies stay same-origin.
  // Pin the monorepo root to frontend so the repo root lockfile is ignored.
  turbopack: { root: __dirname },
  trailingSlash: true,
  // Do not 308 /api/* to add a trailing slash. The proxy Route
  // Handler matches both forms.
  skipTrailingSlashRedirect: true,
  experimental: { optimizePackageImports: ["framer-motion"] },
  transpilePackages: ["lenis"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
