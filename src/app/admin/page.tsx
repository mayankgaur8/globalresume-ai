import type { Metadata } from "next"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CreditCard, BrainCircuit, TrendingUp, Activity } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = { title: "Admin Dashboard" }

function StatCard({
  title,
  value,
  sub,
  icon,
  accent,
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  accent: string
}) {
  return (
    <Card className="bg-slate-800 border-slate-700 text-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</span>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accent}`}>{icon}</div>
        </div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default async function AdminDashboard() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersPrevMonth,
    totalResumes,
    newResumesThisMonth,
    activeSubscriptions,
    planBreakdown,
    aiLogsThisMonth,
    totalAiLogs,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { id: { not: undefined } } }), // placeholder — no createdAt on User
    prisma.user.count(),
    prisma.resume.count(),
    prisma.resume.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.subscription.groupBy({
      by: ["planId"],
      _count: true,
      where: { status: "active" },
    }),
    prisma.aIUsageLog.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.aIUsageLog.count(),
    prisma.user.findMany({
      include: { subscription: { include: { plan: true } }, resumes: { select: { id: true } } },
      orderBy: { id: "desc" },
      take: 8,
    }),
  ])

  // Resolve plan names for breakdown
  const plans = await prisma.plan.findMany()
  const planMap = Object.fromEntries(plans.map((p) => [p.id, p.name]))

  const breakdownByName: Record<string, number> = {}
  for (const row of planBreakdown) {
    const name = row.planId ? (planMap[row.planId] ?? "Unknown") : "No Plan"
    breakdownByName[name] = (breakdownByName[name] ?? 0) + row._count
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview and key metrics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          sub={`${newResumesThisMonth} new resumes this month`}
          icon={<Users className="h-4 w-4 text-blue-400" />}
          accent="bg-blue-900/40"
        />
        <StatCard
          title="Total Resumes"
          value={totalResumes}
          sub={`${newResumesThisMonth} created this month`}
          icon={<FileText className="h-4 w-4 text-emerald-400" />}
          accent="bg-emerald-900/40"
        />
        <StatCard
          title="Paid Subscribers"
          value={activeSubscriptions}
          sub={`${Math.round((activeSubscriptions / Math.max(totalUsers, 1)) * 100)}% conversion`}
          icon={<CreditCard className="h-4 w-4 text-purple-400" />}
          accent="bg-purple-900/40"
        />
        <StatCard
          title="AI Requests"
          value={aiLogsThisMonth}
          sub={`${totalAiLogs} all time`}
          icon={<BrainCircuit className="h-4 w-4 text-amber-400" />}
          accent="bg-amber-900/40"
        />
      </div>

      {/* Subscription breakdown + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan breakdown */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              Paid plan breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["FREE", "BASIC", "PRO", "GLOBAL"].map((name) => {
              const count = breakdownByName[name] ?? 0
              const pct = activeSubscriptions > 0 ? Math.round((count / activeSubscriptions) * 100) : 0
              const colors: Record<string, string> = {
                FREE: "bg-slate-600",
                BASIC: "bg-blue-500",
                PRO: "bg-indigo-500",
                GLOBAL: "bg-amber-500",
              }
              return (
                <div key={name}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{name}</span>
                    <span>{count} users</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[name]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              Admin sections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/admin/users", label: "Manage Users", desc: "View, upgrade, manage accounts" },
              { href: "/admin/subscriptions", label: "Subscriptions", desc: "Active plans and billing" },
              { href: "/admin/templates", label: "Templates", desc: "Manage template catalog" },
              { href: "/admin/languages", label: "Languages", desc: "Manage language access" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* System health */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">System status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Database", ok: true },
              { label: "Auth (NextAuth v5)", ok: true },
              { label: "Stripe", ok: !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "sk_test_dummy" },
              { label: "OpenAI", ok: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "sk-dummy" },
              { label: "Google OAuth", ok: !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "dummy-google-client-id" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{item.label}</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    item.ok
                      ? "bg-emerald-900/40 text-emerald-400"
                      : "bg-amber-900/40 text-amber-400"
                  }`}
                >
                  {item.ok ? "Connected" : "Not configured"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent users */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm">Recent users</CardTitle>
            <Link href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase text-slate-500">
                <th className="text-left py-2 pr-4">User</th>
                <th className="text-left py-2 pr-4">Plan</th>
                <th className="text-left py-2 pr-4">Resumes</th>
                <th className="text-left py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-700/40 hover:bg-slate-700/20">
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-white text-sm">{user.name ?? "—"}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded">
                      {user.subscription?.plan?.name ?? "FREE"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-400 text-xs">{user.resumes.length}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        user.role === "ADMIN"
                          ? "bg-red-900/40 text-red-400"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
