import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "prisma", "bcryptjs", "pdf-parse", "mammoth", "@react-pdf/renderer"],
}

export default withSentryConfig(nextConfig, {
  // Suppress verbose Sentry build output
  silent: !process.env.CI,
  // Auth token — when absent, source-map upload is skipped silently
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Only upload source maps when both DSN and auth token are configured
  sourcemaps: {
    disable: !process.env.SENTRY_DSN || !process.env.SENTRY_AUTH_TOKEN,
  },
  // Disable Sentry build-time telemetry
  telemetry: false,
})
