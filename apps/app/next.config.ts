import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@evenly/ui", "@evenly/core", "@evenly/db", "@evenly/email"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
