"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, FileText, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { UpgradeModal } from "@/components/upgrade-modal"

const TEMPLATE_CATEGORIES: Record<string, { category: string; langs: string[] }> = {
  Modern:             { category: "Universal",         langs: ["EN", "DE", "FR", "ES", "PT"] },
  Classic:            { category: "Universal",         langs: ["EN", "DE", "FR"] },
  Executive:          { category: "Universal",         langs: ["EN"] },
  Minimal:            { category: "Universal",         langs: ["EN", "ES"] },
  Creative:           { category: "Design / Creative", langs: ["EN", "FR"] },
  "ATS Friendly":     { category: "ATS Optimized",    langs: ["EN"] },
  "European CV":      { category: "Europe",            langs: ["EN", "DE", "FR", "ES"] },
  "German Lebenslauf":{ category: "Germany",           langs: ["DE"] },
  "French CV":        { category: "France",            langs: ["FR"] },
  "Japanese Rirekisho":{ category: "Japan",            langs: ["JA"] },
  "Spanish CV":       { category: "Spain / LatAm",    langs: ["ES"] },
  "Portuguese CV":    { category: "Brazil / Portugal", langs: ["PT"] },
}

interface Template {
  id: string
  name: string
  thumbnail: string | null
  isPremium: boolean
}

interface Props {
  templates: Template[]
  hasFullAccess: boolean
  currentPlan: string
}

export function TemplatesClient({ templates, hasFullAccess, currentPlan }: Props) {
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; feature: string }>({
    open: false,
    feature: "",
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Resume Templates</h1>
        <p className="text-slate-500 mt-1">
          Choose a professional template optimized for ATS systems globally.
        </p>
      </div>

      {currentPlan === "FREE" && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            <strong>Free plan:</strong> Only the Modern template is unlocked. Upgrade to access all templates.
          </p>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white shrink-0 ml-4"
            onClick={() => setUpgradeModal({ open: true, feature: "Premium Templates" })}
          >
            Upgrade
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {templates.map((template) => {
          const isLocked = template.isPremium && !hasFullAccess
          const meta = TEMPLATE_CATEGORIES[template.name] || { category: "Standard", langs: ["EN"] }

          return (
            <Card
              key={template.id}
              className={`overflow-hidden transition-all ${isLocked ? "opacity-80" : "hover:shadow-lg"}`}
            >
              {/* Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 border-b relative flex items-center justify-center">
                <FileText className="h-16 w-16 text-slate-300" />

                {isLocked && (
                  <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-white/90 p-2 rounded-full shadow">
                      <Lock className="h-5 w-5 text-slate-700" />
                    </div>
                  </div>
                )}

                {!isLocked && template.isPremium && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Premium
                  </div>
                )}

                {!template.isPremium && (
                  <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Free
                  </div>
                )}
              </div>

              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-base flex justify-between items-center">
                  <span>{template.name}</span>
                  {!isLocked && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-4 py-2">
                <p className="text-xs text-slate-500">{meta.category}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {meta.langs.map((lang) => (
                    <span
                      key={lang}
                      className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-2">
                {isLocked ? (
                  <Button
                    variant="outline"
                    className="w-full border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100"
                    onClick={() => setUpgradeModal({ open: true, feature: `${template.name} Template` })}
                  >
                    <Lock className="h-3 w-3 mr-2" /> Unlock Template
                  </Button>
                ) : (
                  <Link href={`/dashboard/builder/new?template=${template.id}`} className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Use Template</Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: "" })}
        featureName={upgradeModal.feature}
      />
    </div>
  )
}
