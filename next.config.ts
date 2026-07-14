import type { NextConfig } from "next";

const s3PublicUrl = process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL) : null;

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    remotePatterns: s3PublicUrl
      ? [
          // MinIO — used for uploaded project images and avatars
          {
            protocol: s3PublicUrl.protocol.replace(":", "") as "http" | "https",
            hostname: s3PublicUrl.hostname,
            port: s3PublicUrl.port || undefined,
          },
        ]
      : [],
  },
};

export default nextConfig;
