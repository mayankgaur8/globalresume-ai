import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUserPlanLimits } from "@/lib/access"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const [limits, used] = await Promise.all([
    getUserPlanLimits(session.user.id),
    (async () => {
      const start = new Date()
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      return prisma.aIUsageLog.count({
        where: { userId: session.user.id, createdAt: { gte: start } },
      })
    })(),
  ])

  return NextResponse.json({
    used,
    limit: limits.aiCreditsPerMonth,
    plan: limits.plan,
    remaining: Math.max(0, limits.aiCreditsPerMonth - used),
  })
}
