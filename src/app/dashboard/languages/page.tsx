import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getUserPlanLimits } from "@/lib/access"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, CheckCircle2, Globe } from "lucide-react"
import Link from "next/link"

const LANGUAGE_FLAGS: Record<string, string> = {
  en: "🇺🇸", de: "🇩🇪", fr: "🇫🇷", ja: "🇯🇵", zh: "🇨🇳", pt: "🇧🇷", es: "🇪🇸",
}

const LANGUAGE_NOTES: Record<string, string> = {
  en: "Standard format, ATS-optimized",
  de: "Lebenslauf format with photo section",
  fr: "CV with personal info block",
  ja: "Rirekisho traditional format",
  zh: "Chinese resume with personal details",
  pt: "Currículo professional format",
  es: "Hoja de vida Latin American style",
}

export default async function LanguagesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [languages, limits] = await Promise.all([
    prisma.language.findMany({ orderBy: { name: "asc" } }),
    getUserPlanLimits(session.user.id),
  ])

  const unlockedCodes = new Set(["en"])
  if (limits.plan === "ADMIN" || limits.plan === "GLOBAL") {
    languages.forEach((l) => unlockedCodes.add(l.code))
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Languages</h1>
        <p className="text-slate-500 mt-1">Build your resume in the local language for the job market you&apos;re targeting.</p>
      </div>

      {limits.plan === "FREE" && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-900">You&apos;re on the Free plan</p>
            <p className="text-sm text-blue-700 mt-0.5">Upgrade to unlock premium languages and create multilingual resumes.</p>
          </div>
          <Link href="/dashboard/billing">
            <Button className="bg-blue-600 hover:bg-blue-700 shrink-0">Upgrade Plan</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {languages.map((language) => {
          const isUnlocked = unlockedCodes.has(language.code) || !language.isPremium
          return (
            <Card key={language.id} className={`overflow-hidden transition-all ${!isUnlocked ? "opacity-80" : "hover:shadow-md"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <span className="text-3xl">{LANGUAGE_FLAGS[language.code] || "🌐"}</span>
                  <div>
                    <p className="text-base font-semibold">{language.name}</p>
                    <p className="text-xs text-slate-500 font-normal uppercase">{language.code}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <p className="text-sm text-slate-500">{LANGUAGE_NOTES[language.code] || "International format"}</p>
                {isUnlocked && (
                  <div className="flex items-center gap-1.5 mt-2 text-green-600 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Unlocked</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-slate-50 py-3">
                {isUnlocked ? (
                  <Link href={`/dashboard/builder/new?lang=${language.code}`} className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Globe className="h-4 w-4 mr-2" /> Create Resume
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard/billing" className="w-full">
                    <Button variant="outline" className="w-full border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100">
                      <Lock className="h-3.5 w-3.5 mr-2" /> Unlock Language
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
