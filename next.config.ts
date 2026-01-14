import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep SSR mode for now - static export requires generateStaticParams
  // for all dynamic routes, which would need more configuration

  // Disable image optimization if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },
};

export default nextConfig;
