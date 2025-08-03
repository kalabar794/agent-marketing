import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure for Netlify deployment  
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Force dynamic rendering for all pages since we need API calls
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk']
  }
};

export default nextConfig;
