import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    remotePatterns: [
      // R2 / Vercel Blob — used for uploaded project images and avatars
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
