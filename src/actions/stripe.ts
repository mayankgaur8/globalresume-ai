"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createCheckoutSession(priceId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const stripeSession = await stripe.checkout.sessions.create({
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=true`,
    payment_method_types: ['card'],
    mode: 'subscription',
    billing_address_collection: 'auto',
    customer_email: user.email || undefined,
    client_reference_id: user.id,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
  });

  if (!stripeSession.url) {
    throw new Error("Error creating Stripe checkout session");
  }

  redirect(stripeSession.url);
}
