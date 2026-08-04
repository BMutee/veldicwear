import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.cjdropshipping.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.aliyuncs.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
