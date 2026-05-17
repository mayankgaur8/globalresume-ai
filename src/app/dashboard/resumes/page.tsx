import type { Metadata } from "next"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Clock, Globe, Pencil } from "lucide-react"
import { DeleteResumeButton } from "./delete-resume-button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "My Resumes",
  description: "View, edit, and manage all your resumes in one place.",
}

const TEMPLATE_GRADIENTS: Record<string, string> = {
  modern: "from-blue-500 to-indigo-600",
  classic: "from-slate-600 to-slate-800",
  executive: "from-amber-500 to-orange-600",
  creative: "from-pink-500 to-rose-600",
  minimal: "from-slate-400 to-slate-500",
}

function formatDate(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default async function ResumesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Resumes</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {resumes.length === 0
              ? "Create your first resume to get started."
              : `${resumes.length} resume${resumes.length !== 1 ? "s" : ""} — keep building!`}
          </p>
        </div>
        <Link href="/dashboard/builder/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Resume
          </Button>
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No resumes yet</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-xs">
            Start building your first professional resume — it takes less than 10 minutes.
          </p>
          <Link href="/dashboard/builder/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Resume
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {resumes.map((resume) => {
            const gradient = TEMPLATE_GRADIENTS[resume.templateId] ?? "from-slate-400 to-slate-600"
            return (
              <div
                key={resume.id}
                className="group rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-200"
              >
                <div className={cn("h-32 relative overflow-hidden bg-gradient-to-br", gradient)}>
                  <div className="absolute inset-0 flex flex-col justify-center px-5 gap-1.5">
                    <div className="h-2.5 w-20 bg-white/70 rounded-full" />
                    <div className="h-1.5 w-14 bg-white/40 rounded-full" />
                    <div className="mt-2 space-y-1">
                      {[80, 60, 75].map((w, i) => (
                        <div key={i} className="h-1 bg-white/25 rounded-full" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                    {resume.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="h-2.5 w-2.5 mr-1" />
                        {resume.languageCode.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {resume.templateId}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDate(new Date(resume.updatedAt))}
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-4 flex items-center gap-2">
                  <Link href={`/dashboard/builder/${resume.id}`} className="flex-1">
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </Link>
                  <DeleteResumeButton resumeId={resume.id} />
                </div>
              </div>
            )
          })}

          <Link href="/dashboard/builder/new">
            <div className="min-h-[220px] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
              <div className="h-10 w-10 rounded-full border-2 border-current flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">New Resume</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
