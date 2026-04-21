import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/aideaspark",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
