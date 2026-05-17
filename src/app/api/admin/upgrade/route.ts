import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { userId, plan } = await req.json()
  if (!userId || !plan) return new NextResponse("Missing fields", { status: 400 })

  const planRecord = await prisma.plan.findUnique({ where: { name: plan } })
  if (!planRecord) return new NextResponse("Plan not found", { status: 404 })

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, status: "active", planId: planRecord.id },
    update: { status: "active", planId: planRecord.id },
  })

  return NextResponse.json({ ok: true })
}
