import type { NextConfig } from 'next';
const config: NextConfig = {
  // Allow this private Tailscale Serve origin to load dev scripts and HMR.
  allowedDevOrigins: ['fedora.tailbf3f35.ts.net'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:8010'}/api/:path*` }];
  },
};
export default config;
