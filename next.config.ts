import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Required for static export — Next.js image optimisation needs a server
  images: {
    unoptimized: true,
  },
  // Set this if your GitHub Pages URL is github.com/username/repo-name
  // Leave empty ("") if you use a custom domain or username.github.io
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  trailingSlash: true,
};

export default nextConfig;
