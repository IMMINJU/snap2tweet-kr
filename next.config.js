/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
  },
  typescript: {
    // Temporarily allow build to continue with type errors
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/shared/:id/image',
        destination: '/api/shared/:id/image',
      },
    ];
  },
};

export default nextConfig;