import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return new NextResponse(`Webhook Error: ${msg}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    ) as unknown as { id: string; status: string; items: { data: Array<{ price: { id: string } }> }; current_period_end: number };
    
    const userId = session.client_reference_id;
    if (!userId) return new NextResponse("No user id", { status: 400 });

    const priceId = subscription.items.data[0].price.id;

    // Find Plan ID based on stripePriceId
    const plan = await prisma.plan.findUnique({
      where: { stripePriceId: priceId }
    });

    await prisma.subscription.upsert({
      where: {
        userId: userId,
      },
      create: {
        userId: userId,
        stripeSubId: subscription.id,
        stripePriceId: priceId,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        planId: plan?.id,
      },
      update: {
        stripeSubId: subscription.id,
        stripePriceId: priceId,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        planId: plan?.id,
      },
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    ) as unknown as { id: string; status: string; current_period_end: number };

    await prisma.subscription.update({
      where: {
        stripeSubId: subscription.id,
      },
      data: {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}
