import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { FileText, Globe, Plus } from "lucide-react"
import { DeleteResumeButton } from "./delete-resume-button"

export default async function ResumesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Resumes</h1>
          <p className="text-slate-500 mt-1">{resumes.length} resume{resumes.length !== 1 ? "s" : ""} saved</p>
        </div>
        <Link href="/dashboard/builder/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> New Resume
          </Button>
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 text-center bg-slate-50">
          <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No resumes yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Create your first resume to start applying for jobs anywhere in the world.
          </p>
          <Link href="/dashboard/builder/new">
            <Button className="bg-blue-600 hover:bg-blue-700">Create Your First Resume</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resumes.map((resume) => (
            <Card key={resume.id} className="overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 border-b flex items-center justify-center">
                <FileText className="h-12 w-12 text-slate-300" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 truncate">{resume.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <Globe className="h-3 w-3" />
                  <span className="uppercase">{resume.languageCode}</span>
                  <span>·</span>
                  <span>Updated {new Date(resume.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
              <CardFooter className="px-4 py-3 bg-slate-50 border-t flex justify-between items-center">
                <DeleteResumeButton resumeId={resume.id} />
                <Link href={`/dashboard/builder/${resume.id}`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Edit</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
