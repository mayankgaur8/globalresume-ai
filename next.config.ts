import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "prisma", "bcryptjs", "pdf-parse", "mammoth"],
}

export default nextConfig
