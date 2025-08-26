import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/ningbo',
  assetPrefix: '/ningbo',
  trailingSlash: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'cdn.r2.zakeke.com' },
    ],
  }
};

export default nextConfig;


