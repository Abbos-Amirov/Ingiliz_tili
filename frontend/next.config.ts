import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Produces a minimal .next/standalone server bundle for a small Docker image.
  output: "standalone",
};

export default nextConfig;
