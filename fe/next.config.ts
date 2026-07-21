import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const beUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3001";
    return [
      {
        source: "/backend-api/:path*",
        destination: `${beUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
