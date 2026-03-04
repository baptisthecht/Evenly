import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@evoly/ui", "@evoly/core", "@evoly/db", "@evoly/email"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  output: "standalone",
};

export default nextConfig;
