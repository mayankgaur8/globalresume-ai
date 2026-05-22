import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Razorpay from "razorpay"
import prisma from "@/lib/prisma"
import { track } from "@/lib/analytics/server"
import { sendUpgradeConfirmationEmail, sendPaymentFailedEmail } from "@/lib/email"

export async function POST(req: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET is not configured")
    return new NextResponse("Webhook endpoint not configured", { status: 503 })
  }

  const rawBody = await req.text()
  const sig = (await headers()).get("x-razorpay-signature")

  if (!sig) {
    console.error("[razorpay-webhook] Missing x-razorpay-signature header")
    return new NextResponse("Missing signature", { status: 400 })
  }

  const isValid = Razorpay.validateWebhookSignature(rawBody, sig, webhookSecret)
  if (!isValid) {
    console.error("[razorpay-webhook] Signature verification failed")
    return new NextResponse("Webhook signature verification failed", { status: 400 })
  }

  let event: { event: string; payload: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new NextResponse("Invalid JSON body", { status: 400 })
  }

  try {
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload)
        break
      case "payment.failed":
        await handlePaymentFailed(event.payload)
        break
      case "subscription.charged":
        await handleSubscriptionCharged(event.payload)
        break
      case "subscription.cancelled":
        await handleSubscriptionCancelled(event.payload)
        break
      default:
        break
    }
  } catch (err) {
    console.error(`[razorpay-webhook] error handling ${event.event}:`, err)
    return new NextResponse("Internal webhook error", { status: 500 })
  }

  return new NextResponse(null, { status: 200 })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractPayment(payload: Record<string, unknown>) {
  const payment = (payload as { payment?: { entity?: Record<string, unknown> } }).payment?.entity
  return payment ?? null
}

async function handlePaymentCaptured(payload: Record<string, unknown>) {
  const payment = extractPayment(payload)
  if (!payment) return

  const paymentId = payment.id as string | undefined
  const orderId = payment.order_id as string | undefined
  if (!paymentId || !orderId) return

  const order = await prisma.razorpayOrder.findUnique({ where: { orderId } })
  if (!order) return

  // Idempotency — skip if already processed
  if (order.status === "paid" && order.paymentId === paymentId) return

  const plan = await prisma.plan.findUnique({ where: { name: order.planName } })

  await prisma.$transaction([
    prisma.razorpayOrder.update({
      where: { orderId },
      data: { status: "paid", paymentId },
    }),
    prisma.subscription.upsert({
      where: { userId: order.userId },
      create: {
        userId: order.userId,
        status: "active",
        planId: plan?.id,
      },
      update: {
        status: "active",
        planId: plan?.id,
        currentPeriodEnd: null,
      },
    }),
  ])

  track(order.userId, "subscription_activated", { plan: order.planName, provider: "razorpay" })
  const user = await prisma.user.findUnique({
    where: { id: order.userId },
    select: { email: true, name: true },
  })
  if (user?.email) {
    void sendUpgradeConfirmationEmail(user.email, user.name ?? "there", order.planName)
  }
}

async function handlePaymentFailed(payload: Record<string, unknown>) {
  const payment = extractPayment(payload)
  if (!payment) return

  const orderId = payment.order_id as string | undefined
  if (!orderId) return

  const order = await prisma.razorpayOrder.findUnique({ where: { orderId } })
  if (!order) return

  await prisma.razorpayOrder.update({
    where: { orderId },
    data: { status: "failed" },
  })

  track(order.userId, "payment_failed", { plan: order.planName, provider: "razorpay" })
  const user = await prisma.user.findUnique({
    where: { id: order.userId },
    select: { email: true, name: true },
  })
  if (user?.email) {
    void sendPaymentFailedEmail(user.email, user.name ?? "there")
  }
}

async function handleSubscriptionCharged(payload: Record<string, unknown>) {
  const sub = (payload as { subscription?: { entity?: Record<string, unknown> } }).subscription?.entity
  const payment = extractPayment(payload)
  if (!sub || !payment) return

  const paymentId = payment.id as string | undefined
  const orderId = payment.order_id as string | undefined
  if (!paymentId || !orderId) return

  const order = await prisma.razorpayOrder.findUnique({ where: { orderId } })
  if (!order) return
  if (order.status === "paid" && order.paymentId === paymentId) return

  const plan = await prisma.plan.findUnique({ where: { name: order.planName } })

  await prisma.$transaction([
    prisma.razorpayOrder.update({
      where: { orderId },
      data: { status: "paid", paymentId },
    }),
    prisma.subscription.upsert({
      where: { userId: order.userId },
      create: { userId: order.userId, status: "active", planId: plan?.id },
      update: { status: "active", planId: plan?.id },
    }),
  ])
}

async function handleSubscriptionCancelled(payload: Record<string, unknown>) {
  const sub = (payload as { subscription?: { entity?: Record<string, unknown> } }).subscription?.entity
  if (!sub) return

  const notes = sub.notes as Record<string, string> | undefined
  const userId = notes?.userId
  if (!userId) return

  const freePlan = await prisma.plan.findUnique({ where: { name: "FREE" } })

  await prisma.subscription.updateMany({
    where: { userId },
    data: { status: "canceled", planId: freePlan?.id, currentPeriodEnd: null },
  })

  track(userId, "subscription_cancelled", { provider: "razorpay" })
}
