import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/kiosk',
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Force webpack usage
    return config;
  },
  devIndicators: {
    // @ts-ignore
    buildActivity: false
  }
};

export default nextConfig;
