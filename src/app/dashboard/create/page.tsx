import type { Metadata } from "next"
import { auth } from "@/auth"
import { getUserPlanLimits } from "@/lib/access"
import { CreateWizard } from "./wizard-client"

export const metadata: Metadata = { title: "Create Resume — GlobalResumeAI" }

export default async function CreatePage() {
  const session = await auth()
  let userPlan = "FREE"
  if (session?.user?.id) {
    try {
      const limits = await getUserPlanLimits(session.user.id)
      userPlan = limits.plan
    } catch { userPlan = "FREE" }
  }
  return <CreateWizard userPlan={userPlan} />
}
