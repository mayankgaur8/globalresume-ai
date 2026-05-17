import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, FileText, Globe } from "lucide-react"

export default async function DownloadsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, languageCode: true, updatedAt: true },
  })

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Download History</h1>
        <p className="text-slate-500 mt-1">Download any of your saved resumes as PDF.</p>
      </div>

      {resumes.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Download className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p>No resumes to download yet.</p>
          <Link href="/dashboard/builder/new" className="mt-4 inline-block">
            <Button className="bg-blue-600 hover:bg-blue-700">Create a Resume</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <Card key={resume.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{resume.title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Globe className="h-3 w-3" />
                      <span className="uppercase">{resume.languageCode}</span>
                      <span>·</span>
                      <span>Last edited {new Date(resume.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/builder/${resume.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Link href={`/dashboard/builder/${resume.id}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Download className="h-4 w-4 mr-1.5" /> PDF
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
