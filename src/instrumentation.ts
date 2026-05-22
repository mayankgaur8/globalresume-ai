export async function register() {
  // Only initialise Sentry if a DSN is configured — safe to omit in local dev
  if (!process.env.SENTRY_DSN) return

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs")
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
      // Reduce noise from expected operational errors
      ignoreErrors: [
        "UNAUTHORIZED",
        "RATE_LIMITED",
        "RESUME_LIMIT_REACHED",
        "TEMPLATE_ACCESS_DENIED",
      ],
    })
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs")
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    })
  }
}
