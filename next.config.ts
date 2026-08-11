import type { NextConfig } from "next";

const basePath = process.env.GITHUB_PAGES_BASE_PATH || "";
const assetPrefix = process.env.GITHUB_PAGES_ASSET_PREFIX || "";

const nextConfig: NextConfig = {
  basePath,
  assetPrefix,
};

export default nextConfig;
