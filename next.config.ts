import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    // @ts-ignore - buildActivity is valid but types might be outdated
    buildActivity: false
  }
};

export default nextConfig;
