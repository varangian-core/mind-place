import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable linting during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optional: Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
