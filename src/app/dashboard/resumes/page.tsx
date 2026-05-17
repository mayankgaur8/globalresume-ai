import type { Metadata } from "next"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ResumesClient } from "./resumes-client"

export const metadata: Metadata = {
  title: "My Resumes — GlobalResumeAI",
}

function computeScore(sections: { type: string; content: Record<string, unknown> }[]) {
  let score = 0
  const contact = sections.find((s) => s.type === "CONTACT")?.content as Record<string, string> | undefined
  if (contact && Object.values(contact).filter(Boolean).length >= 4) score += 15
  const summary = sections.find((s) => s.type === "SUMMARY")?.content as { text?: string } | undefined
  if ((summary?.text?.length ?? 0) > 50) score += 20
  const exp = sections.find((s) => s.type === "EXPERIENCE")?.content as { items?: unknown[] } | undefined
  const expCount = exp?.items?.length ?? 0
  score += expCount >= 3 ? 25 : expCount >= 1 ? 12 : 0
  const edu = sections.find((s) => s.type === "EDUCATION")?.content as { items?: unknown[] } | undefined
  if ((edu?.items?.length ?? 0) > 0) score += 15
  const skills = sections.find((s) => s.type === "SKILLS")?.content as { items?: unknown[] } | undefined
  const skillCount = skills?.items?.length ?? 0
  score += skillCount >= 5 ? 15 : skillCount >= 1 ? 8 : 0
  return Math.min(score, 100)
}

export default async function ResumesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const rawResumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { sections: true },
  })

  const resumes = rawResumes.map((r) => ({
    id: r.id,
    title: r.title,
    templateId: r.templateId,
    languageCode: r.languageCode,
    targetCountry: r.targetCountry || "US",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    score: computeScore(r.sections as { type: string; content: Record<string, unknown> }[]),
  }))

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Resumes</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {resumes.length === 0
              ? "Create your first resume to get started."
              : `${resumes.length} resume${resumes.length !== 1 ? "s" : ""} — keep building!`}
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Resume
          </Button>
        </Link>
      </div>

      <ResumesClient resumes={resumes} />
    </div>
  )
}
