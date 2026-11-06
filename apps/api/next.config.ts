import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@pharmacy/database', '@pharmacy/shared'],
}

export default nextConfig
