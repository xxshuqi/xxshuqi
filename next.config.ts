import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  watchOptions: {
    ignored: ["**/prisma/**", "**/node_modules/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  serverExternalPackages: ["sharp", "@prisma/client"],
};

export default nextConfig;
