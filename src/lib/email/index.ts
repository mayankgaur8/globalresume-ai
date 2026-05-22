/**
 * Transactional email via Resend.
 * All sends are no-ops when RESEND_API_KEY is not set — safe for local dev.
 */
import { Resend } from "resend"

const FROM = process.env.EMAIL_FROM ?? "GlobalResumeAI <noreply@globalresumeai.com>"

let _resend: Resend | null = null

function getResend(): Resend | null {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  _resend = new Resend(key)
  return _resend
}

interface SendResult {
  sent: boolean
  id?: string
  error?: string
}

async function send(opts: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<SendResult> {
  const client = getResend()
  if (!client) return { sent: false, error: "RESEND_API_KEY not configured" }

  try {
    const result = await client.emails.send({ from: FROM, ...opts })
    return { sent: true, id: result.data?.id }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Lifecycle emails ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<SendResult> {
  return send({
    to,
    subject: "Welcome to GlobalResumeAI 🎉",
    text: `Hi ${name},\n\nWelcome to GlobalResumeAI! Your AI-powered resume builder is ready.\n\nGet started: create your first resume and run an ATS score to see how it performs.\n\nTeam GlobalResumeAI`,
    html: `<h2>Welcome, ${name}!</h2><p>Your AI-powered resume builder is ready. <a href="${process.env.NEXTAUTH_URL}/dashboard">Go to dashboard</a> to create your first resume.</p>`,
  })
}

export async function sendUpgradeConfirmationEmail(
  to: string,
  name: string,
  planName: string
): Promise<SendResult> {
  return send({
    to,
    subject: `You're now on the ${planName} plan ✨`,
    text: `Hi ${name},\n\nYour ${planName} plan is now active. You now have access to premium templates, more AI credits, and advanced export options.\n\nTeam GlobalResumeAI`,
    html: `<h2>Welcome to ${planName}, ${name}!</h2><p>Your premium features are now active. <a href="${process.env.NEXTAUTH_URL}/dashboard">Go to dashboard →</a></p>`,
  })
}

export async function sendCreditWarningEmail(
  to: string,
  name: string,
  used: number,
  total: number
): Promise<SendResult> {
  const pct = Math.round((used / total) * 100)
  return send({
    to,
    subject: `You've used ${pct}% of your AI credits this month`,
    text: `Hi ${name},\n\nYou've used ${used} of ${total} AI credits this month. Upgrade now to get more credits and keep building.\n\nTeam GlobalResumeAI`,
    html: `<p>Hi ${name},</p><p>You've used <strong>${used}/${total}</strong> AI credits this month. <a href="${process.env.NEXTAUTH_URL}/dashboard/billing">Upgrade for more →</a></p>`,
  })
}

export async function sendPaymentFailedEmail(
  to: string,
  name: string
): Promise<SendResult> {
  return send({
    to,
    subject: "Action needed: your payment failed",
    text: `Hi ${name},\n\nWe couldn't process your last payment. Please update your payment method to keep your premium access.\n\nUpdate payment: ${process.env.NEXTAUTH_URL}/dashboard/billing\n\nTeam GlobalResumeAI`,
    html: `<p>Hi ${name},</p><p>We couldn't process your payment. <a href="${process.env.NEXTAUTH_URL}/dashboard/billing">Update your payment method →</a></p>`,
  })
}
