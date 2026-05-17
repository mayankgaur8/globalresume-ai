import type { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BoldProfileClient } from "./profile-client"

export const metadata: Metadata = { title: "Bold Profile — GlobalResumeAI" }

export default async function BoldProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return <BoldProfileClient user={{ name: session.user.name, email: session.user.email, image: session.user.image }} />
}
