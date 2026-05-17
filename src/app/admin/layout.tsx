import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Languages, FileText, Settings, ShieldAlert } from "lucide-react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-900 text-slate-300">
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            <span className="font-bold text-lg text-white">Admin Panel</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start hover:text-white hover:bg-slate-800">
              <LayoutDashboard className="mr-3 h-5 w-5" /> Overview
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start hover:text-white hover:bg-slate-800">
              <Users className="mr-3 h-5 w-5" /> Users
            </Button>
          </Link>
          <Link href="/admin/subscriptions">
            <Button variant="ghost" className="w-full justify-start hover:text-white hover:bg-slate-800">
              <CreditCard className="mr-3 h-5 w-5" /> Subscriptions
            </Button>
          </Link>
          <Link href="/admin/templates">
            <Button variant="ghost" className="w-full justify-start hover:text-white hover:bg-slate-800">
              <FileText className="mr-3 h-5 w-5" /> Templates
            </Button>
          </Link>
          <Link href="/admin/languages">
            <Button variant="ghost" className="w-full justify-start hover:text-white hover:bg-slate-800">
              <Languages className="mr-3 h-5 w-5" /> Languages
            </Button>
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-900 p-8">
        {children}
      </main>
    </div>
  );
}
