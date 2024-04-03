/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true
  },
  async headers() {
    return [
      {
        // Routes this applies to
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
      }
    ];
  }
};

module.exports = nextConfig;
