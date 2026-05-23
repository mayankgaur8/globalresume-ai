import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
  const checks: Record<string, string> = {}

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = "connected"
  } catch (err) {
    checks.db = "unreachable"
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { status: "error", checks, error: message.slice(0, 200), timestamp: new Date().toISOString() },
      { status: 503 }
    )
  }

  try {
    await prisma.user.count()
    checks.user_table = "ok"
  } catch {
    checks.user_table = "missing"
  }

  try {
    await prisma.plan.count()
    checks.plan_table = "ok"
  } catch {
    checks.plan_table = "missing"
  }

  const allOk = Object.values(checks).every((v) => v === "ok" || v === "connected")

  checks.stripe = process.env.STRIPE_SECRET_KEY ? "configured" : "not_configured"
  checks.openai = process.env.OPENAI_API_KEY ? "configured" : "not_configured"
  checks.razorpay = process.env.RAZORPAY_KEY_ID ? "configured" : "not_configured"

  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  )
}
