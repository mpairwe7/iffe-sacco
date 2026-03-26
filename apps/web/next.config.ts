import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@iffe/shared"],
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon", "@neondatabase/serverless", "bcryptjs", "jose"],
};

export default nextConfig;
