import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@raanko/shared'],
  reactStrictMode: true,
};

export default nextConfig;
