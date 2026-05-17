"use server"

import { auth } from "@/auth"
import { stripe, stripeEnabled } from "@/lib/stripe"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export async function createCheckoutSession(priceId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (!stripeEnabled || !stripe) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY to your .env file.")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true },
  })
  if (!user) throw new Error("User not found")

  // Re-use existing Stripe customer if available
  let customerId = user.stripeCustomerId ?? undefined
  if (!customerId && user.email) {
    const customer = await stripe.customers.create({ email: user.email })
    customerId = customer.id
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const stripeSession = await stripe.checkout.sessions.create({
    customer: customerId,
    success_url: `${BASE_URL}/dashboard/billing?success=true`,
    cancel_url: `${BASE_URL}/dashboard/billing?canceled=true`,
    payment_method_types: ["card"],
    mode: "subscription",
    billing_address_collection: "auto",
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { userId: user.id },
    },
  })

  if (!stripeSession.url) throw new Error("Failed to create Stripe checkout session")
  redirect(stripeSession.url)
}

export async function createPortalSession() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (!stripeEnabled || !stripe) {
    throw new Error("Stripe is not configured.")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    throw new Error("No billing account found. Please upgrade first.")
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${BASE_URL}/dashboard/billing`,
  })

  redirect(portal.url)
}

export async function cancelSubscription() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (!stripeEnabled || !stripe) throw new Error("Stripe is not configured.")

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { stripeSubId: true },
  })

  if (!subscription?.stripeSubId) throw new Error("No active subscription found")

  await stripe.subscriptions.cancel(subscription.stripeSubId)

  await prisma.subscription.update({
    where: { userId: session.user.id },
    data: { status: "canceled" },
  })

  redirect("/dashboard/billing?canceled_plan=true")
}
