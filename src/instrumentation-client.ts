import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    integrations: [Sentry.replayIntegration()],
  })
}

// Required for Sentry navigation span tracking in Next.js App Router
export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse"
) {
  if (dsn) {
    Sentry.startInactiveSpan({
      name: `navigation ${navigationType} ${url}`,
      op: "navigation",
      attributes: { url, navigationType },
    }).end()
  }
}
