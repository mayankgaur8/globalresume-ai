import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BuilderClient } from "./builder-client"

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  return <BuilderClient resumeId={id} userId={session.user.id} userRole={session.user.role} />
}
