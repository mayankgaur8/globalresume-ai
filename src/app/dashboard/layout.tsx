import { ReactNode } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardNav } from "./nav-client"
import prisma from "@/lib/prisma"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  })
  const plan = subscription?.plan?.name || "FREE"

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DashboardNav
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        }}
        plan={plan}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
