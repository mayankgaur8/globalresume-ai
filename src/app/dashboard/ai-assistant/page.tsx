import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, FileText, Globe, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AIAssistantPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const features = [
    {
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      title: "Generate Professional Summary",
      description: "AI writes a compelling 3-4 sentence summary tailored to your job title and experience.",
      action: "Use in Resume Builder",
      href: "/dashboard/builder/new",
    },
    {
      icon: <Globe className="h-6 w-6 text-indigo-600" />,
      title: "Translate Resume Content",
      description: "Automatically translate your entire resume into German, French, Japanese, or Spanish.",
      action: "Open Languages",
      href: "/dashboard/languages",
    },
    {
      icon: <Zap className="h-6 w-6 text-amber-600" />,
      title: "ATS Score Checker",
      description: "Analyze your resume against job descriptions and get a compatibility score.",
      action: "Coming Soon",
      href: "#",
    },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">AI Assistant</h1>
        </div>
        <p className="text-slate-500">Let AI help you write, translate, and optimize your resume.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {features.map((f) => (
          <Card key={f.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-500 mb-4">{f.description}</p>
              <Link href={f.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                  disabled={f.href === "#"}
                >
                  {f.action}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <CardContent className="p-6">
          <p className="text-slate-400 text-sm mb-1">Pro tip</p>
          <p className="font-semibold text-lg mb-2">Use AI in the Resume Builder</p>
          <p className="text-slate-300 text-sm">
            Open any resume in the builder and click &ldquo;✨ Generate with AI&rdquo; in the Summary section to get an instant AI-written professional summary.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
