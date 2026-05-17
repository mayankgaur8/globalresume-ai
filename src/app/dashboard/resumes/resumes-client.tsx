"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LayoutGrid, List, Plus, Pencil, Download, Copy, Trash2,
  MoreHorizontal, Clock, Globe, CheckCircle2, Circle,
  ArrowUpDown, FileText, Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

interface Resume {
  id: string
  title: string
  templateId: string
  languageCode: string
  targetCountry: string
  createdAt: Date
  updatedAt: Date
  score: number
}

interface ResumesClientProps {
  resumes: Resume[]
}

function ResumeThumbnailSVG({ templateId }: { templateId: string }) {
  const configs: Record<string, { accent: string; header: string; bg: string }> = {
    modern: { accent: "#3B82F6", header: "#1E3A5F", bg: "#EFF6FF" },
    classic: { accent: "#374151", header: "#111827", bg: "#F9FAFB" },
    executive: { accent: "#D97706", header: "#0F172A", bg: "#FFFBEB" },
    minimal: { accent: "#94A3B8", header: "#334155", bg: "#F8FAFC" },
    creative: { accent: "#EC4899", header: "#831843", bg: "#FDF4FF" },
    "ats-friendly": { accent: "#1F2937", header: "#111827", bg: "#FFFFFF" },
    german: { accent: "#DC2626", header: "#1F2937", bg: "#FEF2F2" },
    french: { accent: "#2563EB", header: "#1E3A8A", bg: "#EFF6FF" },
    japanese: { accent: "#DC2626", header: "#991B1B", bg: "#FFF1F2" },
  }
  const c = configs[templateId] ?? configs.modern
  return (
    <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="120" height="160" fill={c.bg} rx="2" />
      <rect width="120" height="38" fill={c.header} />
      <circle cx="20" cy="19" r="9" fill="white" opacity="0.2" />
      <rect x="34" y="10" width="48" height="4.5" rx="2" fill="white" opacity="0.9" />
      <rect x="34" y="18" width="32" height="3" rx="1.5" fill="white" opacity="0.6" />
      <rect x="34" y="24" width="56" height="2" rx="1" fill="white" opacity="0.4" />
      <rect x="8" y="46" width="28" height="2.5" rx="1.25" fill={c.accent} />
      <rect x="8" y="52" width="104" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="56" width="90" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="60" width="104" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="70" width="30" height="2.5" rx="1.25" fill={c.accent} />
      <rect x="8" y="76" width="85" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="80" width="95" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="84" width="75" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="94" width="28" height="2.5" rx="1.25" fill={c.accent} />
      <rect x="8" y="100" width="45" height="5" rx="2.5" fill={c.accent} opacity="0.15" />
      <rect x="56" y="100" width="35" height="5" rx="2.5" fill={c.accent} opacity="0.15" />
      <rect x="8" y="112" width="28" height="2.5" rx="1.25" fill={c.accent} />
      <rect x="8" y="118" width="104" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="122" width="80" height="1.5" rx="0.75" fill="#CBD5E1" />
    </svg>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 45 ? "bg-amber-500" : "bg-red-400"
  const textColor = score >= 70 ? "text-emerald-700" : score >= 45 ? "text-amber-700" : "text-red-600"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-xs font-semibold tabular-nums w-8 text-right", textColor)}>{score}</span>
    </div>
  )
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatRelativeDate(date: Date) {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function ResumesClient({ resumes }: ResumesClientProps) {
  const [view, setView] = useState<"grid" | "list">("list")
  const [boldProfiles, setBoldProfiles] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    await fetch(`/api/resumes/${id}`, { method: "DELETE" })
    toast(`"${title}" deleted`, "success")
    router.refresh()
  }

  const handleDuplicate = async (id: string, title: string) => {
    const res = await fetch(`/api/resumes/${id}`)
    if (!res.ok) { toast("Failed to duplicate", "error"); return }
    const data = await res.json()
    const createRes = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, title: `${title} (Copy)`, sections: data.sections }),
    })
    if (createRes.ok) {
      toast(`Duplicated as "${title} (Copy)"`, "success")
      router.refresh()
    } else {
      toast("Duplicate failed", "error")
    }
  }

  const handleRename = async (id: string, currentTitle: string) => {
    const newTitle = prompt("New resume name:", currentTitle)
    if (!newTitle || newTitle === currentTitle) return
    await fetch(`/api/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    })
    toast("Resume renamed", "success")
    router.refresh()
  }

  const toggleBoldProfile = (id: string) => {
    setBoldProfiles((prev) => ({ ...prev, [id]: !prev[id] }))
    toast(boldProfiles[id] ? "Removed from Bold Profile" : "Added to Bold Profile", "success")
  }

  if (resumes.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No resumes yet</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-xs">
          Build your first professional resume in under 10 minutes.
        </p>
        <Link href="/dashboard/create">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Resume
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{resumes.length} resume{resumes.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView("list")}
            className={cn("p-1.5 rounded-md transition-colors", view === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={cn("p-1.5 rounded-md transition-colors", view === "grid" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === "list" ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_140px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <button className="flex items-center gap-1 hover:text-slate-800 text-left">
              Resume <ArrowUpDown className="h-3 w-3" />
            </button>
            <button className="flex items-center gap-1 hover:text-slate-800">
              Modified <ArrowUpDown className="h-3 w-3" />
            </button>
            <button className="flex items-center gap-1 hover:text-slate-800">
              Created <ArrowUpDown className="h-3 w-3" />
            </button>
            <span>Score</span>
            <span>Bold Profile</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {resumes.map((resume) => (
              <div key={resume.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_140px] gap-4 items-center px-5 py-4 hover:bg-slate-50 transition-colors group">
                {/* Resume name + thumbnail */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                    <ResumeThumbnailSVG templateId={resume.templateId} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{resume.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="secondary" className="text-xs capitalize px-1.5 py-0">{resume.templateId}</Badge>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        <Globe className="h-2.5 w-2.5 mr-0.5" />{resume.languageCode.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Modified */}
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {formatRelativeDate(resume.updatedAt)}
                </div>

                {/* Created */}
                <div className="text-sm text-slate-500">{formatDate(resume.createdAt)}</div>

                {/* Score */}
                <div>
                  <ScoreBar score={resume.score} />
                </div>

                {/* Bold profile toggle */}
                <div className="flex justify-center">
                  <button
                    onClick={() => toggleBoldProfile(resume.id)}
                    className="transition-colors"
                    title={boldProfiles[resume.id] ? "Remove from Bold Profile" : "Add to Bold Profile"}
                  >
                    {boldProfiles[resume.id]
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : <Circle className="h-5 w-5 text-slate-300 hover:text-slate-500" />
                    }
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/dashboard/builder/${resume.id}`}>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Link href={`/dashboard/builder/${resume.id}`}>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-violet-600 hover:bg-violet-50">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => handleDuplicate(resume.id, resume.title)} className="flex items-center gap-2 cursor-pointer">
                        <Copy className="h-4 w-4 text-slate-400" />Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRename(resume.id, resume.title)} className="flex items-center gap-2 cursor-pointer">
                        <Pencil className="h-4 w-4 text-slate-400" />Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(resume.id, resume.title)}
                        className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resumes.map((resume) => (
            <div key={resume.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-200">
              {/* Thumbnail */}
              <div className="h-36 bg-slate-50 relative overflow-hidden">
                <ResumeThumbnailSVG templateId={resume.templateId} />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-blue-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link href={`/dashboard/builder/${resume.id}`}>
                    <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 text-xs h-7 font-semibold shadow-sm">
                      <Pencil className="h-3 w-3 mr-1" />Edit
                    </Button>
                  </Link>
                  <Button size="sm" className="bg-white text-slate-700 hover:bg-slate-50 text-xs h-7 shadow-sm">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Card body */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{resume.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatRelativeDate(resume.updatedAt)}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 shrink-0 -mr-1 -mt-0.5 transition-colors">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleDuplicate(resume.id, resume.title)} className="gap-2 cursor-pointer">
                        <Copy className="h-4 w-4 text-slate-400" />Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRename(resume.id, resume.title)} className="gap-2 cursor-pointer">
                        <Pencil className="h-4 w-4 text-slate-400" />Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(resume.id, resume.title)}
                        className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-2">
                  <ScoreBar score={resume.score} />
                </div>
              </div>
            </div>
          ))}

          {/* New resume card */}
          <Link href="/dashboard/create">
            <div className="min-h-[200px] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
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
