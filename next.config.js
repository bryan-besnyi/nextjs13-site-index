/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-scroll-area'],
    // Workaround for vercel/next.js#100326 (stale CSS after build-cache restore).
    // Remove after upgrading to Next.js 16.4.4+.
    turbopackFileSystemCacheForBuild: false
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          // Allow for specific domains to have access or * for all
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
            // DOES NOT WORK
            // value: process.env.ALLOWED_ORIGIN,
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      },
      {
        // Apply these headers to admin routes
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
