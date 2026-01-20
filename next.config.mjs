/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Suppress the "Serializing big strings" warning in development
      config.infrastructureLogging = {
        level: 'error',
      }
    }
    return config
  },
};

export default nextConfig;
