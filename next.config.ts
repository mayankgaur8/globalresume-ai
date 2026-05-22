import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "prisma", "bcryptjs", "pdf-parse", "mammoth", "@react-pdf/renderer"],
}

export default withSentryConfig(nextConfig, {
  // Suppress verbose Sentry build output
  silent: !process.env.CI,
  // Only upload source maps when DSN is configured (avoids errors in local dev)
  sourcemaps: {
    disable: !process.env.SENTRY_DSN,
  },
  // Disable Sentry build-time telemetry
  telemetry: false,
})
