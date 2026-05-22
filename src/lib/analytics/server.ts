/**
 * Server-side PostHog analytics.
 * Safe to import in Server Components, API routes, and Server Actions.
 * No-ops when NEXT_PUBLIC_POSTHOG_KEY is not set.
 */
import { PostHog } from "posthog-node"

let _client: PostHog | null = null

function getClient(): PostHog | null {
  if (_client) return _client
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null
  _client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  })
  return _client
}

export type AnalyticsEvent =
  | "resume_created"
  | "resume_deleted"
  | "resume_exported_pdf"
  | "ai_summary_generated"
  | "ai_cover_letter_generated"
  | "ai_bullet_rewritten"
  | "ai_ats_optimized"
  | "ai_credit_limit_reached"
  | "template_access_denied"
  | "upgrade_modal_shown"
  | "checkout_started"
  | "subscription_activated"
  | "subscription_cancelled"
  | "payment_failed"
  | "signup_completed"

interface EventProps {
  plan?: string
  templateId?: string
  resumeId?: string
  language?: string
  feature?: string
  provider?: string
  tokensUsed?: number
  [key: string]: string | number | boolean | undefined
}

export function track(
  userId: string,
  event: AnalyticsEvent,
  props: EventProps = {}
) {
  const client = getClient()
  if (!client) return
  client.capture({ distinctId: userId, event, properties: props })
}

export function identify(
  userId: string,
  traits: Record<string, string | number | boolean | null>
) {
  const client = getClient()
  if (!client) return
  client.identify({ distinctId: userId, properties: traits })
}

export async function flush() {
  return getClient()?.shutdown()
}
