import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Globe, Crown } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.id) return null;

  // Fetch user data and resumes
  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 5
  });

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true }
  });

  const currentPlan = subscription?.plan?.name || "FREE";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {session.user.name?.split(" ")[0] || "User"}!</h1>
          <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening with your global career profile.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/builder/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Create Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Resumes</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Current Plan</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold uppercase">{currentPlan}</div>
            {currentPlan === "FREE" && (
              <p className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">Upgrade for more features</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Unlocked Languages</CardTitle>
            <Globe className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPlan === "GLOBAL" ? "All" : currentPlan === "PRO" ? "3" : currentPlan === "BASIC" ? "1" : "English"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Resumes */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Recent Resumes</h2>
            <Link href="/dashboard/resumes" className="text-sm font-medium text-blue-600 hover:underline">View all</Link>
          </div>
          
          {resumes.length === 0 ? (
            <Card className="border-dashed bg-slate-50 border-slate-300 flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No resumes yet</h3>
              <p className="text-slate-500 mb-6 max-w-sm">Create your first resume to start applying for jobs anywhere in the world.</p>
              <Link href="/dashboard/builder/new">
                <Button>Create Your First Resume</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {resumes.map(resume => (
                <Card key={resume.id} className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="h-32 bg-slate-100 border-b relative">
                    {/* Placeholder for template thumbnail */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-slate-300" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-900 truncate pr-2">{resume.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 uppercase flex items-center">
                          <Globe className="h-3 w-3 mr-1" /> {resume.languageCode}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="px-4 py-3 bg-slate-50 border-t flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-slate-400">Updated {new Date(resume.updatedAt).toLocaleDateString()}</p>
                    <Link href={`/dashboard/builder/${resume.id}`}>
                      <Button size="sm" variant="secondary">Edit</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Quick Actions / Tips */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">AI Tips</h2>
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-blue-100">
            <CardHeader>
              <CardTitle className="text-lg text-indigo-900">Tailoring for Germany?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-indigo-800 mb-4">
                Did you know? German &ldquo;Lebenslauf&rdquo; requires a photo, date of birth, and place of birth. Our templates adapt automatically!
              </p>
              <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
                Unlock German Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
