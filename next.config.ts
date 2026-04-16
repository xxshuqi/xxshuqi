import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    loader: "custom",
    loaderFile: "./src/lib/imageLoader.ts",
  },
  // Empty basePath for custom domain (served from root)
  basePath: "",
  trailingSlash: true,
};

export default nextConfig;
