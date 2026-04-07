import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/photo-*",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/upload/*",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/*",
      },
    ],
  },
};

export default nextConfig;
