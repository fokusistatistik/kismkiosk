import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
