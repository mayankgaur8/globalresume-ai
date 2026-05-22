import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { razorpay, razorpayEnabled } from "@/lib/razorpay"
import { PLAN_PRICES, isPaidPlan } from "@/lib/plan-prices"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  if (!razorpayEnabled || !razorpay) {
    return NextResponse.json(
      { error: "Payment system is not configured. Contact support." },
      { status: 503 }
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const planName = (body as Record<string, unknown>).planName
  if (typeof planName !== "string" || !isPaidPlan(planName)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  // Server-side price — never trust frontend amount
  const priceConfig = PLAN_PRICES[planName]

  const plan = await prisma.plan.findUnique({ where: { name: planName } })
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  }

  const receipt = `rcpt_${session.user.id.slice(-8)}_${Date.now()}`

  const order = await razorpay.orders.create({
    amount: priceConfig.amount,
    currency: priceConfig.currency,
    receipt,
  })

  await prisma.razorpayOrder.create({
    data: {
      orderId: order.id,
      userId: session.user.id,
      planName,
      amount: priceConfig.amount,
      currency: priceConfig.currency,
      status: "created",
    },
  })

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  })
}
