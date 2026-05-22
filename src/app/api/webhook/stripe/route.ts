import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe, stripeEnabled } from "@/lib/stripe"
import prisma from "@/lib/prisma"
import Stripe from "stripe"

export async function POST(req: Request) {
  if (!stripeEnabled || !stripe) {
    return new NextResponse("Stripe not configured", { status: 503 })
  }

  // Require the signing secret — never process unsigned events
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured")
    return new NextResponse("Webhook endpoint not configured", { status: 503 })
  }

  const body = await req.text()
  const sig = (await headers()).get("stripe-signature")
  if (!sig) {
    console.error("[stripe-webhook] Missing stripe-signature header")
    return new NextResponse("Missing signature", { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature"
    console.error("[stripe-webhook] signature verification failed:", msg)
    return new NextResponse("Webhook signature verification failed", { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break
      case "invoice.payment_succeeded":
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object as Stripe.Invoice)
        break
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        break
    }
  } catch (err) {
    console.error(`[stripe-webhook] error handling ${event.type}:`, err)
    return new NextResponse("Internal webhook error", { status: 500 })
  }

  return new NextResponse(null, { status: 200 })
}

// ── Period end helper ─────────────────────────────────────────────────────────
// In Stripe API "basil" (v22+), current_period_end moved to SubscriptionItem

function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const ts = sub.items?.data?.[0]?.current_period_end
  return ts ? new Date(ts * 1000) : null
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  if (!stripe) return
  const userId = session.client_reference_id
  if (!userId || !session.subscription) return

  const sub = await stripe.subscriptions.retrieve(session.subscription as string)
  const priceId = sub.items.data[0]?.price.id
  const plan = await prisma.plan.findFirst({ where: { stripePriceId: priceId } })
  const periodEnd = getPeriodEnd(sub)

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubId: sub.id,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodEnd: periodEnd,
      planId: plan?.id,
    },
    update: {
      stripeSubId: sub.id,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodEnd: periodEnd,
      planId: plan?.id,
    },
  })

  if (session.customer) {
    await prisma.user.updateMany({
      where: { id: userId, stripeCustomerId: null },
      data: { stripeCustomerId: session.customer as string },
    })
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!stripe) return
  // In Stripe "basil" API, subscription is accessed via invoice.parent.subscription_details
  const subRef = invoice.parent?.subscription_details?.subscription
  if (!subRef) return

  const subId = typeof subRef === "string" ? subRef : subRef.id
  const sub = await stripe.subscriptions.retrieve(subId)
  const priceId = sub.items.data[0]?.price.id
  const plan = await prisma.plan.findFirst({ where: { stripePriceId: priceId } })
  const periodEnd = getPeriodEnd(sub)

  await prisma.subscription.updateMany({
    where: { stripeSubId: sub.id },
    data: {
      status: "active",
      currentPeriodEnd: periodEnd,
      planId: plan?.id,
    },
  })
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const subRef = invoice.parent?.subscription_details?.subscription
  if (!subRef) return
  const subId = typeof subRef === "string" ? subRef : subRef.id

  await prisma.subscription.updateMany({
    where: { stripeSubId: subId },
    data: { status: "past_due" },
  })
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price.id
  const plan = await prisma.plan.findFirst({ where: { stripePriceId: priceId } })
  const periodEnd = getPeriodEnd(sub)

  await prisma.subscription.updateMany({
    where: { stripeSubId: sub.id },
    data: {
      status: sub.status,
      currentPeriodEnd: periodEnd,
      stripePriceId: priceId,
      planId: plan?.id,
    },
  })
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const freePlan = await prisma.plan.findUnique({ where: { name: "FREE" } })

  await prisma.subscription.updateMany({
    where: { stripeSubId: sub.id },
    data: {
      status: "canceled",
      stripeSubId: null,
      stripePriceId: null,
      currentPeriodEnd: null,
      planId: freePlan?.id,
    },
  })
}
