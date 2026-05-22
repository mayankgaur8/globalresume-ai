import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils"
import prisma from "@/lib/prisma"
import { track } from "@/lib/analytics/server"
import { sendUpgradeConfirmationEmail } from "@/lib/email"

export async function POST(req: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    return NextResponse.json({ error: "Payment system not configured" }, { status: 503 })
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

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    body as Record<string, unknown>

  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return NextResponse.json({ error: "Missing required payment fields" }, { status: 400 })
  }

  const isValid = validatePaymentVerification(
    { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
    razorpay_signature,
    keySecret
  )

  if (!isValid) {
    console.error("[razorpay-verify] signature verification failed for order:", razorpay_order_id)
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
  }

  const order = await prisma.razorpayOrder.findUnique({
    where: { orderId: razorpay_order_id },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order does not belong to this user" }, { status: 403 })
  }

  // Idempotent — if already paid, return success without double-processing
  if (order.status === "paid") {
    return NextResponse.json({ success: true })
  }

  const plan = await prisma.plan.findUnique({ where: { name: order.planName } })

  await prisma.$transaction([
    prisma.razorpayOrder.update({
      where: { orderId: razorpay_order_id },
      data: { status: "paid", paymentId: razorpay_payment_id },
    }),
    prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
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

  // Fire-and-forget side effects — never block the response
  track(session.user.id, "subscription_activated", { plan: order.planName, provider: "razorpay" })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  })
  if (user?.email && order.planName) {
    void sendUpgradeConfirmationEmail(user.email, user.name ?? "there", order.planName)
  }

  return NextResponse.json({ success: true })
}
