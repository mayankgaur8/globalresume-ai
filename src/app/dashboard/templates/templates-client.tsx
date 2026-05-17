"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Lock, CheckCircle2, Sparkles, Search } from "lucide-react"
import Link from "next/link"
import { UpgradeModal } from "@/components/upgrade-modal"
import { cn } from "@/lib/utils"

// ── Template metadata ──────────────────────────────────────────────────────────

const TEMPLATE_META: Record<
  string,
  {
    category: string
    langs: string[]
    gradient: string
    desc: string
    targetCountry?: string
  }
> = {
  Modern: {
    category: "Universal",
    langs: ["EN", "DE", "FR", "ES", "PT"],
    gradient: "from-blue-500 to-indigo-600",
    desc: "Clean, minimal — great for tech & startups",
  },
  Classic: {
    category: "Universal",
    langs: ["EN", "DE", "FR"],
    gradient: "from-slate-600 to-slate-800",
    desc: "Traditional two-column for corporate roles",
  },
  Executive: {
    category: "Universal",
    langs: ["EN"],
    gradient: "from-amber-500 to-orange-600",
    desc: "Bold and authoritative for senior positions",
  },
  Minimal: {
    category: "Universal",
    langs: ["EN", "ES"],
    gradient: "from-slate-400 to-slate-500",
    desc: "Ultra-minimal whitespace-first design",
  },
  Creative: {
    category: "Creative",
    langs: ["EN", "FR"],
    gradient: "from-pink-500 to-rose-600",
    desc: "Stand out with a vibrant, expressive layout",
  },
  "ATS Friendly": {
    category: "ATS",
    langs: ["EN"],
    gradient: "from-emerald-500 to-teal-600",
    desc: "Optimized to pass every ATS parser",
  },
  "European CV": {
    category: "Europe",
    langs: ["EN", "DE", "FR", "ES"],
    gradient: "from-violet-500 to-purple-700",
    desc: "Europass-inspired — trusted across the EU",
  },
  "German Lebenslauf": {
    category: "Germany",
    langs: ["DE"],
    gradient: "from-gray-700 to-gray-900",
    desc: "Includes photo, DOB — meets German standards",
    targetCountry: "🇩🇪",
  },
  "French CV": {
    category: "France",
    langs: ["FR"],
    gradient: "from-blue-700 to-blue-900",
    desc: "Photo-first layout for the French market",
    targetCountry: "🇫🇷",
  },
  "Japanese Rirekisho": {
    category: "Japan",
    langs: ["JA"],
    gradient: "from-red-600 to-red-800",
    desc: "Traditional format for Japanese employers",
    targetCountry: "🇯🇵",
  },
  "Spanish CV": {
    category: "Spain",
    langs: ["ES"],
    gradient: "from-yellow-500 to-red-600",
    desc: "Tailored for Spanish and LATAM markets",
    targetCountry: "🇪🇸",
  },
  "Portuguese CV": {
    category: "Brazil",
    langs: ["PT"],
    gradient: "from-green-600 to-emerald-800",
    desc: "Optimized for Brazilian & Portuguese companies",
    targetCountry: "🇧🇷",
  },
}

const CATEGORIES = ["All", "Universal", "ATS", "Europe", "Germany", "France", "Japan", "Spain", "Brazil", "Creative"]

// ── Mini preview ───────────────────────────────────────────────────────────────

function TemplatePreview({ gradient, name }: { gradient: string; name: string }) {
  return (
    <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)}>
      {/* Simulated resume layout */}
      <div className="absolute top-0 left-0 right-0 h-[38%] bg-black/25 flex flex-col justify-center px-4 gap-1.5">
        <div className="flex items-center gap-2">
          {name.includes("German") && (
            <div className="h-8 w-8 rounded-full bg-white/30 shrink-0" />
          )}
          <div className="space-y-1">
            <div className="h-2.5 w-20 bg-white/80 rounded-full" />
            <div className="h-1.5 w-14 bg-white/50 rounded-full" />
          </div>
        </div>
        <div className="h-1 w-24 bg-white/30 rounded-full" />
      </div>
      <div className="absolute top-[40%] left-0 right-0 bottom-0 p-3 space-y-1.5">
        <div className="h-1.5 w-10 bg-white/40 rounded-full" />
        {[85, 70, 90, 60, 75].map((w, i) => (
          <div key={i} className="h-1 bg-white/20 rounded-full" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

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
  const [activeCategory, setActiveCategory] = useState("All")
  const [search, setSearch] = useState("")

  const filtered = templates.filter((t) => {
    const meta = TEMPLATE_META[t.name]
    const cat = meta?.category ?? "Universal"
    const matchesCategory = activeCategory === "All" || cat === activeCategory
    const matchesSearch =
      search === "" ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (meta?.desc ?? "").toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Resume Templates</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {templates.length} professional templates — optimized for ATS systems globally.
        </p>
      </div>

      {/* Upgrade banner */}
      {currentPlan === "FREE" && (
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-sm text-amber-900">
              <strong>Free plan:</strong> Only the Modern template is unlocked. Upgrade for all 12 templates.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white shrink-0 ml-4"
            onClick={() => setUpgradeModal({ open: true, feature: "Premium Templates" })}
          >
            Upgrade
          </Button>
        </div>
      )}

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "h-10 px-3 rounded-xl text-sm font-medium transition-all",
                activeCategory === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Search className="h-10 w-10 mb-3" />
          <p className="font-medium text-slate-600">No templates found</p>
          <p className="text-sm mt-1">Try adjusting your search or category filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((template) => {
            const isLocked = template.isPremium && !hasFullAccess
            const meta = TEMPLATE_META[template.name] ?? {
              category: "Standard",
              langs: ["EN"],
              gradient: "from-slate-400 to-slate-600",
              desc: "",
            }

            return (
              <div
                key={template.id}
                className={cn(
                  "group rounded-2xl border bg-white overflow-hidden transition-all duration-200",
                  isLocked
                    ? "border-slate-200 opacity-90"
                    : "border-slate-200 hover:border-blue-300 hover:shadow-lg"
                )}
              >
                {/* Visual preview */}
                <div className="h-44 relative overflow-hidden">
                  <TemplatePreview gradient={meta.gradient} name={template.name} />

                  {/* Country badge */}
                  {meta.targetCountry && (
                    <div className="absolute top-2 left-2 text-base">
                      {meta.targetCountry}
                    </div>
                  )}

                  {/* Plan badge */}
                  <div className="absolute top-2 right-2">
                    {!template.isPremium ? (
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Free
                      </span>
                    ) : (
                      <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Pro
                      </span>
                    )}
                  </div>

                  {/* Lock overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center backdrop-blur-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/95 rounded-xl px-4 py-2 flex items-center gap-2 shadow-md">
                        <Lock className="h-4 w-4 text-slate-700" />
                        <span className="text-sm font-semibold text-slate-800">Upgrade to unlock</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-900">{template.name}</h3>
                    {!isLocked && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">{meta.desc}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {meta.langs.map((lang) => (
                      <span
                        key={lang}
                        className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-4 pb-4">
                  {isLocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100"
                      onClick={() => setUpgradeModal({ open: true, feature: `${template.name} Template` })}
                    >
                      <Lock className="h-3 w-3 mr-1.5" />
                      Unlock Template
                    </Button>
                  ) : (
                    <Link href={`/dashboard/builder/new?template=${template.id}`} className="w-full block">
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                        Use Template
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: "" })}
        featureName={upgradeModal.feature}
      />
    </div>
  )
}
