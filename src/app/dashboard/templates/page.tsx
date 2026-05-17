import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserPlanLimits } from "@/lib/access"
import { TemplatesClient } from "./templates-client"

export default async function TemplatesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [templates, limits] = await Promise.all([
    prisma.template.findMany({ orderBy: { name: "asc" } }),
    getUserPlanLimits(session.user.id),
  ])

  const hasFullAccess = limits.plan === "ADMIN" || limits.plan === "GLOBAL" || limits.plan === "PRO"

  return <TemplatesClient templates={templates} hasFullAccess={hasFullAccess} currentPlan={limits.plan} />
}
