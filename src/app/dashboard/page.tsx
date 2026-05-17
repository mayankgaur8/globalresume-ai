import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus, FileText, Briefcase, Mail, User, Crown, Sparkles,
  ArrowRight, Download, TrendingUp, Clock, Zap, Target,
  CheckCircle2, Circle, ChevronRight, Star, Globe,
} from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { cn } from "@/lib/utils"

const PLAN_STYLES: Record<string, { badge: string; label: string }> = {
  FREE: { badge: "bg-slate-100 text-slate-600", label: "Free" },
  BASIC: { badge: "bg-blue-100 text-blue-700", label: "Basic" },
  PRO: { badge: "bg-indigo-100 text-indigo-700", label: "Pro" },
  GLOBAL: { badge: "bg-amber-100 text-amber-700", label: "Global" },
  ADMIN: { badge: "bg-red-100 text-red-700", label: "Admin" },
}

function computeResumeScore(sections: { type: string; content: Record<string, unknown> }[]) {
  let score = 0
  const breakdown: { label: string; points: number; max: number; done: boolean }[] = []

  const contact = sections.find((s) => s.type === "CONTACT")?.content as Record<string, string> | undefined
  const hasContact = contact && Object.values(contact).filter(Boolean).length >= 4
  score += hasContact ? 15 : 0
  breakdown.push({ label: "Contact Info", points: hasContact ? 15 : 0, max: 15, done: !!hasContact })

  const summary = sections.find((s) => s.type === "SUMMARY")?.content as { text?: string } | undefined
  const hasSummary = (summary?.text?.length ?? 0) > 50
  score += hasSummary ? 20 : 0
  breakdown.push({ label: "Professional Summary", points: hasSummary ? 20 : 0, max: 20, done: hasSummary })

  const exp = sections.find((s) => s.type === "EXPERIENCE")?.content as { items?: unknown[] } | undefined
  const expCount = exp?.items?.length ?? 0
  const expPoints = expCount >= 3 ? 25 : expCount >= 1 ? 12 : 0
  score += expPoints
  breakdown.push({ label: "Work History", points: expPoints, max: 25, done: expCount > 0 })

  const edu = sections.find((s) => s.type === "EDUCATION")?.content as { items?: unknown[] } | undefined
  const hasEdu = (edu?.items?.length ?? 0) > 0
  score += hasEdu ? 15 : 0
  breakdown.push({ label: "Education", points: hasEdu ? 15 : 0, max: 15, done: hasEdu })

  const skills = sections.find((s) => s.type === "SKILLS")?.content as { items?: unknown[] } | undefined
  const skillCount = skills?.items?.length ?? 0
  const skillPoints = skillCount >= 5 ? 15 : skillCount >= 1 ? 8 : 0
  score += skillPoints
  breakdown.push({ label: "Skills", points: skillPoints, max: 15, done: skillCount > 0 })

  const atsPoints = hasSummary && expCount >= 1 ? 10 : 0
  score += atsPoints
  breakdown.push({ label: "ATS Keywords", points: atsPoints, max: 10, done: atsPoints > 0 })

  return { score, breakdown }
}

function ScoreRing({ score }: { score: number }) {
  const r = 32
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444"
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="rotate-[-90deg]">
      <circle cx="42" cy="42" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x="42" y="46" textAnchor="middle" fill={color} fontSize="18" fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "42px 42px" }}>
        {score}
      </text>
    </svg>
  )
}

function ResumeThumbnailSVG({ templateId }: { templateId: string }) {
  const configs: Record<string, { accent: string; header: string; bg: string }> = {
    modern: { accent: "#3B82F6", header: "#1E3A5F", bg: "#EFF6FF" },
    classic: { accent: "#374151", header: "#111827", bg: "#F9FAFB" },
    executive: { accent: "#D97706", header: "#0F172A", bg: "#FFFBEB" },
    minimal: { accent: "#94A3B8", header: "#334155", bg: "#F8FAFC" },
    creative: { accent: "#EC4899", header: "#831843", bg: "#FDF4FF" },
    "ats-friendly": { accent: "#1F2937", header: "#111827", bg: "#FFFFFF" },
  }
  const c = configs[templateId] ?? configs.modern
  return (
    <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="120" height="160" fill={c.bg} rx="2" />
      <rect width="120" height="40" fill={c.header} />
      <circle cx="22" cy="20" r="10" fill="white" opacity="0.2" />
      <rect x="36" y="10" width="50" height="5" rx="2" fill="white" opacity="0.9" />
      <rect x="36" y="18" width="35" height="3" rx="1.5" fill="white" opacity="0.6" />
      <rect x="36" y="24" width="60" height="2.5" rx="1.25" fill="white" opacity="0.4" />
      <rect x="8" y="48" width="30" height="2.5" rx="1.25" fill={c.accent} />
      <rect x="8" y="54" width="104" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="58" width="104" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="62" width="80" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="72" width="35" height="2.5" rx="1.25" fill={c.accent} />
      <rect x="8" y="78" width="104" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="82" width="90" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="86" width="104" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="90" width="70" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="100" width="30" height="2.5" rx="1.25" fill={c.accent} />
      <rect x="8" y="106" width="50" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="110" width="45" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="120" width="30" height="2.5" rx="1.25" fill={c.accent} />
      <rect x="8" y="126" width="40" height="5" rx="2.5" fill={c.accent} opacity="0.15" />
      <rect x="52" y="126" width="32" height="5" rx="2.5" fill={c.accent} opacity="0.15" />
      <rect x="88" y="126" width="24" height="5" rx="2.5" fill={c.accent} opacity="0.15" />
      <rect x="8" y="136" width="104" height="1.5" rx="0.75" fill="#CBD5E1" />
      <rect x="8" y="140" width="80" height="1.5" rx="0.75" fill="#CBD5E1" />
    </svg>
  )
}

function formatRelativeDate(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return date.toLocaleDateString()
}

const ACTION_CARDS = [
  {
    href: "/dashboard/resumes",
    icon: <Target className="h-5 w-5" />,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    title: "Fix Your Resume",
    desc: "Improve your score and beat the ATS",
    badge: "Score boost",
    badgeBg: "bg-rose-50 text-rose-700",
  },
  {
    href: "/dashboard/jobs",
    icon: <Briefcase className="h-5 w-5" />,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "Search Jobs",
    desc: "Browse 10,000+ matching positions worldwide",
    badge: "New jobs daily",
    badgeBg: "bg-blue-50 text-blue-700",
  },
  {
    href: "/dashboard/profile",
    icon: <User className="h-5 w-5" />,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    title: "Bold Profile",
    desc: "Share your public candidate profile",
    badge: "Get discovered",
    badgeBg: "bg-violet-50 text-violet-700",
  },
  {
    href: "/dashboard/cover-letter",
    icon: <Mail className="h-5 w-5" />,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    title: "Cover Letter",
    desc: "AI-generated letters tailored to each job",
    badge: "AI powered",
    badgeBg: "bg-emerald-50 text-emerald-700",
  },
]

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [resumes, subscription] = await Promise.all([
    prisma.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { sections: true },
    }),
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    }),
  ])

  const currentPlan = subscription?.plan?.name || "FREE"
  const planStyle = PLAN_STYLES[currentPlan] ?? PLAN_STYLES.FREE
  const firstName = session.user.name?.split(" ")[0] || "there"
  const isFreePlan = currentPlan === "FREE"

  const topResume = resumes[0]
  const topScore = topResume
    ? computeResumeScore(topResume.sections as { type: string; content: Record<string, unknown> }[])
    : null

  const checklistItems = [
    { label: "Create your first resume", done: resumes.length > 0, href: "/dashboard/create" },
    { label: "Choose a template", done: resumes.length > 0, href: "/dashboard/templates" },
    { label: "Add work experience", done: (topScore?.score ?? 0) >= 25, href: topResume ? `/dashboard/builder/${topResume.id}` : "/dashboard/create" },
    { label: "Get your resume score above 70", done: (topScore?.score ?? 0) >= 70, href: topResume ? `/dashboard/builder/${topResume.id}` : "/dashboard/create" },
    { label: "Download your PDF", done: false, href: "/dashboard/downloads" },
  ]

  const completedSteps = checklistItems.filter((i) => i.done).length
  const progressPct = Math.round((completedSteps / checklistItems.length) * 100)

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 lg:p-8 text-white shadow-xl shadow-blue-500/20">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-8 -right-8 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("text-xs font-semibold border-0", planStyle.badge)}>
                {planStyle.label} Plan
              </Badge>
              {isFreePlan && (
                <Link href="/dashboard/billing" className="text-xs text-blue-200 hover:text-white underline underline-offset-2">
                  Upgrade →
                </Link>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold">Hello, {firstName}! 👋</h1>
            <p className="text-blue-100 mt-1 text-sm">
              {resumes.length === 0
                ? "Ready to build your first resume? Let's get started."
                : `${resumes.length} resume${resumes.length !== 1 ? "s" : ""} — keep building your career!`}
            </p>
          </div>
          <Link href="/dashboard/create" className="shrink-0">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-none w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create New Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: Resume card + recent */}
        <div className="xl:col-span-2 space-y-5">

          {/* Top resume preview */}
          {topResume && topScore ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="flex items-start gap-4 p-5">
                {/* Thumbnail */}
                <div className="w-24 h-32 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                  <ResumeThumbnailSVG templateId={topResume.templateId} />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-slate-900 text-lg truncate">{topResume.title}</h2>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last edited {formatRelativeDate(new Date(topResume.updatedAt))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/dashboard/builder/${topResume.id}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-8">
                          Edit Resume
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" className="border-slate-200 text-xs h-8">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Resume score */}
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <ScoreRing score={topScore.score} />
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resume Score</p>
                        <p className={cn("text-2xl font-bold", topScore.score >= 70 ? "text-emerald-600" : topScore.score >= 45 ? "text-amber-600" : "text-red-600")}>
                          {topScore.score}<span className="text-sm text-slate-400">/100</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {topScore.score >= 70 ? "Great!" : topScore.score >= 45 ? "Needs work" : "Improve now"}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 hidden sm:block">
                      <div className="grid grid-cols-2 gap-1.5">
                        {topScore.breakdown.slice(0, 4).map((item) => (
                          <div key={item.label} className="flex items-center gap-1.5">
                            {item.done
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              : <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            }
                            <span className="text-xs text-slate-600 truncate">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score improvement bar */}
              {topScore.score < 70 && (
                <div className="px-5 pb-5">
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-800">Improve your score</p>
                      <p className="text-xs text-amber-700">
                        {topScore.breakdown.find((b) => !b.done)?.label
                          ? `Add ${topScore.breakdown.find((b) => !b.done)!.label} to boost your score`
                          : "Your resume looks great!"}
                      </p>
                    </div>
                    <Link href={`/dashboard/builder/${topResume.id}`}>
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shrink-0 text-xs h-7">
                        Fix Now
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 mx-auto">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Build your first resume</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                Create a professional, ATS-optimized resume in under 10 minutes.
              </p>
              <Link href="/dashboard/create">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Resume
                </Button>
              </Link>
            </div>
          )}

          {/* Action cards */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Next Steps</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACTION_CARDS.map((card) => (
                <Link key={card.href} href={card.href} className="group">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex items-start gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", card.iconBg, card.iconColor)}>
                      {card.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{card.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{card.desc}</p>
                      <span className={cn("inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full", card.badgeBg)}>{card.badge}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent resumes */}
          {resumes.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">All Resumes</h2>
                <Link href="/dashboard/resumes" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {resumes.slice(1, 4).map((resume) => (
                  <Link key={resume.id} href={`/dashboard/builder/${resume.id}`} className="group">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-200">
                      <div className="h-20 bg-slate-50">
                        <ResumeThumbnailSVG templateId={resume.templateId} />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{resume.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatRelativeDate(new Date(resume.updatedAt))}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link href="/dashboard/create" className="group">
                  <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 h-full min-h-[120px] flex flex-col items-center justify-center gap-1.5 hover:border-blue-300 hover:bg-blue-50 transition-all">
                    <div className="h-8 w-8 rounded-full border-2 border-slate-300 group-hover:border-blue-400 flex items-center justify-center transition-colors">
                      <Plus className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-blue-600 font-medium transition-colors">New</span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Progress checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 text-sm">Profile Progress</h3>
              <span className="text-xs font-semibold text-slate-500">{progressPct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="space-y-2.5">
              {checklistItems.map((item) => (
                <Link key={item.label} href={item.href} className="group flex items-center gap-2.5">
                  {item.done
                    ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    : <Circle className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                  }
                  <span className={cn(
                    "text-sm flex-1",
                    item.done ? "text-slate-400 line-through" : "text-slate-700 group-hover:text-blue-700"
                  )}>
                    {item.label}
                  </span>
                  {!item.done && <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-400" />}
                </Link>
              ))}
            </div>
          </div>

          {/* Upgrade card */}
          {isFreePlan && (
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-4 w-4 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-wide text-indigo-200">Unlock Pro</span>
              </div>
              <h3 className="font-bold text-lg mb-1">Supercharge your search</h3>
              <ul className="space-y-1.5 mb-4">
                {["8 premium templates", "3 languages", "Unlimited AI rewrites", "ATS score & analysis"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-indigo-100 text-sm">
                    <Star className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/billing">
                <Button size="sm" className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-none">
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Upgrade to Pro — $12/mo
                </Button>
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Your Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-sm text-slate-700">Resumes created</span>
                </div>
                <span className="font-bold text-slate-900">{resumes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  <span className="text-sm text-slate-700">AI credits</span>
                </div>
                <span className="font-bold text-slate-900">
                  {isFreePlan ? "5 left" : "∞"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Globe className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700">Languages</span>
                </div>
                <span className="font-bold text-slate-900">
                  {currentPlan === "GLOBAL" || currentPlan === "ADMIN" ? "25+" : currentPlan === "PRO" ? "3" : "1"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-sm text-slate-700">Best score</span>
                </div>
                <span className="font-bold text-slate-900">
                  {topScore ? `${topScore.score}/100` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* AI tip */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">AI Tip</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Matching keywords from the job description boosts your ATS score by up to <strong className="text-white">40%</strong>. Use our ATS analyzer in the builder.
            </p>
            <Link href={topResume ? `/dashboard/builder/${topResume.id}` : "/dashboard/create"}>
              <Button size="sm" variant="outline" className="mt-3 w-full border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white text-xs">
                Analyze my resume
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
