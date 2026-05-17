import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  FileText,
  Globe,
  Crown,
  Sparkles,
  ArrowRight,
  Download,
  Layout,
  Languages,
  TrendingUp,
  Clock,
  Zap,
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

const LANGUAGE_COUNT: Record<string, string> = {
  FREE: "English only",
  BASIC: "1 language",
  PRO: "3 languages",
  GLOBAL: "All 25+",
  ADMIN: "All 25+",
}

function TemplateThumbnail({ templateId }: { templateId: string }) {
  const gradients: Record<string, string> = {
    modern: "from-blue-500 to-indigo-600",
    classic: "from-slate-600 to-slate-800",
    executive: "from-amber-500 to-orange-600",
    creative: "from-pink-500 to-rose-600",
  }
  const gradient = gradients[templateId] ?? "from-slate-400 to-slate-600"
  return (
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-80",
        gradient
      )}
    >
      <div className="absolute inset-0 flex flex-col justify-center items-center gap-1.5 p-4">
        <div className="h-2 w-16 bg-white/70 rounded-full" />
        <div className="h-1.5 w-10 bg-white/40 rounded-full" />
        <div className="mt-2 space-y-1 w-full px-2">
          {[80, 65, 90, 55].map((w, i) => (
            <div key={i} className="h-1 bg-white/30 rounded-full" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

const QUICK_ACTIONS = [
  {
    href: "/dashboard/builder/new",
    icon: <Plus className="h-5 w-5 text-blue-600" />,
    bg: "bg-blue-50",
    label: "New Resume",
    desc: "Start from scratch",
  },
  {
    href: "/dashboard/templates",
    icon: <Layout className="h-5 w-5 text-indigo-600" />,
    bg: "bg-indigo-50",
    label: "Templates",
    desc: "Browse all designs",
  },
  {
    href: "/dashboard/languages",
    icon: <Languages className="h-5 w-5 text-emerald-600" />,
    bg: "bg-emerald-50",
    label: "Languages",
    desc: "Unlock more locales",
  },
  {
    href: "/dashboard/downloads",
    icon: <Download className="h-5 w-5 text-amber-600" />,
    bg: "bg-amber-50",
    label: "Downloads",
    desc: "Export your PDFs",
  },
]

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

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [resumes, subscription] = await Promise.all([
    prisma.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
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

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">

      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 lg:p-8 text-white shadow-lg shadow-blue-600/20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Welcome back</p>
            <h1 className="text-2xl lg:text-3xl font-bold">
              Hello, {firstName}! 👋
            </h1>
            <p className="text-blue-100 mt-1 text-sm">
              {resumes.length === 0
                ? "Ready to build your first resume? Let's get started."
                : `You have ${resumes.length} resume${resumes.length !== 1 ? "s" : ""}. Keep building!`}
            </p>
          </div>
          <Link href="/dashboard/builder/new" className="shrink-0">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-none border-0 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resumes</span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{resumes.length}</p>
            <p className="text-xs text-slate-400 mt-1">created</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Crown className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <p className={cn("text-sm font-bold px-2 py-0.5 rounded-full inline-block", planStyle.badge)}>
              {planStyle.label}
            </p>
            {isFreePlan && (
              <Link href="/dashboard/billing" className="block mt-2 text-xs text-blue-600 hover:underline font-medium">
                Upgrade →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Languages</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Globe className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {currentPlan === "GLOBAL" || currentPlan === "ADMIN" ? "∞" : currentPlan === "PRO" ? "3" : currentPlan === "BASIC" ? "1" : "1"}
            </p>
            <p className="text-xs text-slate-400 mt-1">{LANGUAGE_COUNT[currentPlan]}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Credits</span>
              <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {isFreePlan ? "5" : currentPlan === "BASIC" ? "50" : "∞"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isFreePlan ? "remaining this month" : "unlimited"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href}>
              <div className="flex flex-col gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", a.bg)}>
                  {a.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                    {a.label}
                  </p>
                  <p className="text-xs text-slate-400">{a.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent resumes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Recent Resumes</h2>
            {resumes.length > 0 && (
              <Link
                href="/dashboard/resumes"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {resumes.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-12 text-center">
              <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <FileText className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No resumes yet</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs">
                Create your first resume and start applying to jobs anywhere in the world.
              </p>
              <Link href="/dashboard/builder/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Resume
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resumes.map((resume) => (
                <Link
                  key={resume.id}
                  href={`/dashboard/builder/${resume.id}`}
                  className="group block"
                >
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-200">
                    {/* Thumbnail */}
                    <div className="h-28 relative overflow-hidden bg-slate-100">
                      <TemplateThumbnail templateId={resume.templateId} />
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                        {resume.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {resume.languageCode.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeDate(new Date(resume.updatedAt))}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 pb-3">
                      <div className="flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Edit resume <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {/* New resume card */}
              <Link href="/dashboard/builder/new">
                <div className="h-full min-h-[200px] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
                  <div className="h-10 w-10 rounded-full border-2 border-current flex items-center justify-center">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">New Resume</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Upgrade card for free users */}
          {isFreePlan && (
            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-indigo-200" />
                <span className="text-xs font-semibold uppercase tracking-wide text-indigo-200">
                  Unlock More
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">Go Pro</h3>
              <p className="text-indigo-200 text-sm mb-4">
                Access all templates, 3 languages, unlimited AI rewrites, and priority PDF exports.
              </p>
              <Link href="/dashboard/billing">
                <Button
                  size="sm"
                  className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-none"
                >
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          )}

          {/* AI tip card */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600" />
                AI Tip of the day
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-3">
              <p>
                Tailor your resume for each application. Matching keywords from the job description boosts your
                ATS score by up to <strong>40%</strong>.
              </p>
              <Link href="/dashboard/ai-assistant">
                <Button variant="outline" size="sm" className="w-full border-slate-200 text-slate-700 hover:border-violet-300 hover:text-violet-700">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Open AI Assistant
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Completion checklist */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">Profile completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Create a resume", done: resumes.length > 0 },
                { label: "Choose a template", done: resumes.length > 0 },
                { label: "Add work experience", done: false },
                { label: "Download your PDF", done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full flex items-center justify-center shrink-0 text-white",
                      item.done ? "bg-emerald-500" : "border-2 border-slate-200 bg-white"
                    )}
                  >
                    {item.done && (
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      item.done ? "text-slate-400 line-through" : "text-slate-700"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
