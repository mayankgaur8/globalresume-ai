"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  LayoutDashboard, FileText, Briefcase, Mail, User, LayoutTemplate,
  CreditCard, Bell, ChevronDown, Settings, LogOut, Globe, Zap, Crown,
  Plus,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase, exact: false },
  { href: "/dashboard/resumes", label: "Resumes", icon: FileText, exact: false },
  { href: "/dashboard/cover-letter", label: "Cover Letter", icon: Mail, exact: false },
  { href: "/dashboard/profile", label: "Bold Profile", icon: User, exact: false },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate, exact: false },
  { href: "/dashboard/billing", label: "Pricing", icon: CreditCard, exact: false },
]

const PLAN_STYLES: Record<string, { badge: string; label: string; icon: React.ReactNode }> = {
  FREE: { badge: "bg-slate-100 text-slate-600 border-slate-200", label: "Free", icon: null },
  BASIC: { badge: "bg-blue-100 text-blue-700 border-blue-200", label: "Basic", icon: <Zap className="h-3 w-3" /> },
  PRO: { badge: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Pro", icon: <Crown className="h-3 w-3" /> },
  GLOBAL: { badge: "bg-amber-100 text-amber-700 border-amber-200", label: "Global", icon: <Globe className="h-3 w-3" /> },
  ADMIN: { badge: "bg-red-100 text-red-700 border-red-200", label: "Admin", icon: <Crown className="h-3 w-3" /> },
}

interface NavUser {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
}

interface DashboardNavProps {
  user: NavUser
  plan: string
}

export function DashboardNav({ user, plan }: DashboardNavProps) {
  const pathname = usePathname()
  const [hasNotif] = useState(true)

  if (pathname.startsWith("/dashboard/builder/")) return null

  const planStyle = PLAN_STYLES[plan] ?? PLAN_STYLES.FREE
  const isFreePlan = plan === "FREE"
  const initials = user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U"

  return (
    <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-50 shrink-0">
      <div className="flex items-center h-full px-4 lg:px-6 gap-4 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="h-7 w-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm hidden sm:block">
            GlobalResume<span className="text-blue-600">AI</span>
          </span>
        </Link>

        {/* Nav links — hidden on mobile, shown on lg+ */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Create resume CTA */}
          <Link href="/dashboard/create" className="hidden sm:block">
            <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Resume
            </Button>
          </Link>

          {/* Upgrade CTA */}
          {isFreePlan && (
            <Link href="/dashboard/billing">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-xs hidden sm:flex">
                <Zap className="h-3.5 w-3.5 mr-1" />
                Upgrade
              </Button>
            </Link>
          )}

          {/* Plan badge */}
          <Badge
            className={cn(
              "hidden md:flex items-center gap-1 text-xs font-semibold border",
              planStyle.badge
            )}
          >
            {planStyle.icon}
            {planStyle.label}
          </Badge>

          {/* Notifications */}
          <button className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
            <Bell className="h-4.5 w-4.5" />
            {hasNotif && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full ring-2 ring-transparent hover:ring-blue-100 transition-all p-0.5 outline-none">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 hidden sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900 text-sm truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                <Badge className={cn("mt-1.5 text-xs border", planStyle.badge)}>
                  {planStyle.icon && <span className="mr-1">{planStyle.icon}</span>}
                  {planStyle.label} Plan
                </Badge>
              </div>
              <DropdownMenuItem>
                <Link href="/dashboard/profile" className="flex items-center gap-2 w-full">
                  <User className="h-4 w-4 text-slate-400" />Bold Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/settings" className="flex items-center gap-2 w-full">
                  <Settings className="h-4 w-4 text-slate-400" />Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/billing" className="flex items-center gap-2 w-full">
                  <CreditCard className="h-4 w-4 text-slate-400" />Billing & Plan
                </Link>
              </DropdownMenuItem>
              {user.role === "ADMIN" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/admin" className="flex items-center gap-2 w-full text-red-600">
                      <Crown className="h-4 w-4" />Admin Panel
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-600 focus:text-red-600 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
