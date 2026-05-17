import { ReactNode } from "react"
import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Languages,
  Settings,
  CreditCard,
  Plus,
  Download,
  Sparkles,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SignOutButton } from "@/components/sign-out-button"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-md p-1">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">GlobalResumeAI</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50">
              <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/resumes">
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50">
              <FileText className="mr-3 h-5 w-5" /> My Resumes
            </Button>
          </Link>
          <Link href="/dashboard/builder/new">
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50">
              <Plus className="mr-3 h-5 w-5" /> Create Resume
            </Button>
          </Link>
          <Link href="/dashboard/templates">
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50">
              <FileText className="mr-3 h-5 w-5" /> Templates
            </Button>
          </Link>
          <Link href="/dashboard/languages">
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50">
              <Languages className="mr-3 h-5 w-5" /> Languages
            </Button>
          </Link>
          <Link href="/dashboard/downloads">
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50">
              <Download className="mr-3 h-5 w-5" /> Downloads
            </Button>
          </Link>
          <Link href="/dashboard/ai-assistant">
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50">
              <Sparkles className="mr-3 h-5 w-5" /> AI Assistant
            </Button>
          </Link>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account</p>
            <Link href="/dashboard/billing">
              <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                <CreditCard className="mr-3 h-5 w-5" /> Billing & Plan
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                <Settings className="mr-3 h-5 w-5" /> Preferences
              </Button>
            </Link>
          </div>

          {session.user.role === "ADMIN" && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                  Admin Panel
                </Button>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3 px-2">
            <Avatar>
              <AvatarImage src={session.user.image || ""} />
              <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{session.user.name}</p>
              <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
