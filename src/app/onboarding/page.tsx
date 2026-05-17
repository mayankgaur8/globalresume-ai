"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Globe,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  MapPin,
  Languages,
  Briefcase,
  BarChart2,
  Layout,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Step data ──────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: "DE", label: "Germany", flag: "🇩🇪" },
  { code: "FR", label: "France", flag: "🇫🇷" },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "JP", label: "Japan", flag: "🇯🇵" },
  { code: "CA", label: "Canada", flag: "🇨🇦" },
  { code: "AU", label: "Australia", flag: "🇦🇺" },
  { code: "NL", label: "Netherlands", flag: "🇳🇱" },
  { code: "CH", label: "Switzerland", flag: "🇨🇭" },
  { code: "SE", label: "Sweden", flag: "🇸🇪" },
  { code: "SG", label: "Singapore", flag: "🇸🇬" },
  { code: "AE", label: "UAE", flag: "🇦🇪" },
]

const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "de", label: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "French", native: "Français", flag: "🇫🇷" },
  { code: "es", label: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "ja", label: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "pt", label: "Portuguese", native: "Português", flag: "🇧🇷" },
]

const JOB_ROLES = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "Designer (UX/UI)",
  "Marketing Manager",
  "Sales Executive",
  "Finance / Accounting",
  "Human Resources",
  "Operations Manager",
  "Project Manager",
  "Consultant",
  "Other",
]

const EXPERIENCE_LEVELS = [
  {
    value: "student",
    label: "Student / Intern",
    desc: "Currently studying or seeking an internship",
    icon: "🎓",
  },
  {
    value: "entry",
    label: "Entry Level",
    desc: "0–2 years of professional experience",
    icon: "🌱",
  },
  {
    value: "mid",
    label: "Mid Level",
    desc: "3–7 years in your field",
    icon: "🚀",
  },
  {
    value: "senior",
    label: "Senior Level",
    desc: "8+ years, leading teams or projects",
    icon: "⭐",
  },
]

const TEMPLATES = [
  {
    id: "modern",
    label: "Modern",
    desc: "Clean, minimal — great for tech & startups",
    gradient: "from-blue-500 to-indigo-600",
    accent: "bg-blue-100 text-blue-700",
  },
  {
    id: "classic",
    label: "Classic",
    desc: "Traditional two-column for corporate roles",
    gradient: "from-slate-600 to-slate-800",
    accent: "bg-slate-100 text-slate-700",
  },
  {
    id: "executive",
    label: "Executive",
    desc: "Bold and authoritative for senior positions",
    gradient: "from-amber-500 to-orange-600",
    accent: "bg-amber-100 text-amber-700",
  },
  {
    id: "creative",
    label: "Creative",
    desc: "Stand out with a vibrant, expressive layout",
    gradient: "from-pink-500 to-rose-600",
    accent: "bg-pink-100 text-pink-700",
  },
]

// ── Step components ────────────────────────────────────────────────────────────

function StepCountry({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => onChange(c.code)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 hover:border-blue-300 hover:bg-blue-50",
              value === c.code
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-slate-200 bg-white"
            )}
          >
            <span className="text-2xl shrink-0">{c.flag}</span>
            <span
              className={cn(
                "text-sm font-medium",
                value === c.code ? "text-blue-700" : "text-slate-700"
              )}
            >
              {c.label}
            </span>
            {value === c.code && (
              <Check className="h-4 w-4 text-blue-600 ml-auto shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepLanguage({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => onChange(l.code)}
          className={cn(
            "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 hover:border-blue-300 hover:bg-blue-50",
            value === l.code
              ? "border-blue-500 bg-blue-50 shadow-sm"
              : "border-slate-200 bg-white"
          )}
        >
          <span className="text-2xl shrink-0">{l.flag}</span>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-semibold",
                value === l.code ? "text-blue-700" : "text-slate-800"
              )}
            >
              {l.label}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{l.native}</p>
          </div>
          {value === l.code && (
            <Check className="h-4 w-4 text-blue-600 shrink-0" />
          )}
        </button>
      ))}
    </div>
  )
}

function StepJobRole({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [custom, setCustom] = useState("")
  const isCustom = !JOB_ROLES.slice(0, -1).includes(value) && value !== ""
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {JOB_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r === "Other" ? "" : r)}
            className={cn(
              "p-3 rounded-xl border-2 text-sm font-medium text-left transition-all duration-150 hover:border-blue-300 hover:bg-blue-50",
              value === r || (r === "Other" && isCustom)
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-700"
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-slate-500 font-medium">Or type your own role</p>
        <Input
          placeholder="e.g. DevOps Engineer, Nurse, Teacher…"
          value={isCustom ? value : custom}
          onChange={(e) => {
            setCustom(e.target.value)
            onChange(e.target.value)
          }}
          className="h-10 border-slate-200 focus:border-blue-500"
        />
      </div>
    </div>
  )
}

function StepExperience({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      {EXPERIENCE_LEVELS.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => onChange(l.value)}
          className={cn(
            "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 hover:border-blue-300 hover:bg-blue-50",
            value === l.value
              ? "border-blue-500 bg-blue-50 shadow-sm"
              : "border-slate-200 bg-white"
          )}
        >
          <span className="text-2xl shrink-0">{l.icon}</span>
          <div className="flex-1">
            <p
              className={cn(
                "font-semibold text-sm",
                value === l.value ? "text-blue-700" : "text-slate-800"
              )}
            >
              {l.label}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{l.desc}</p>
          </div>
          {value === l.value && (
            <Check className="h-5 w-5 text-blue-600 shrink-0" />
          )}
        </button>
      ))}
    </div>
  )
}

function TemplateMiniPreview({ gradient }: { gradient: string }) {
  return (
    <div
      className={cn(
        "relative w-full aspect-[3/4] rounded-lg bg-gradient-to-br overflow-hidden",
        gradient
      )}
    >
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 h-1/4 bg-black/20 flex flex-col justify-center px-3 gap-1">
        <div className="h-2 w-16 bg-white/80 rounded-full" />
        <div className="h-1.5 w-10 bg-white/50 rounded-full" />
      </div>
      {/* Content lines */}
      <div className="absolute top-1/4 left-0 right-0 bottom-0 p-3 space-y-2">
        {[80, 65, 90, 55, 70].map((w, i) => (
          <div
            key={i}
            className="h-1.5 bg-white/30 rounded-full"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function StepTemplate({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "flex flex-col rounded-2xl border-2 overflow-hidden text-left transition-all duration-150 hover:shadow-lg",
            value === t.id
              ? "border-blue-500 shadow-md"
              : "border-slate-200 hover:border-blue-200"
          )}
        >
          <div className="p-3 bg-slate-50">
            <TemplateMiniPreview gradient={t.gradient} />
          </div>
          <div className="p-3 border-t border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-semibold text-sm text-slate-800">{t.label}</p>
              {value === t.id && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  <Check className="h-3 w-3" /> Selected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-snug">{t.desc}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

// ── Step config ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: "country",
    title: "Where are you applying?",
    subtitle: "We'll tailor your resume to match local expectations.",
    icon: <MapPin className="h-5 w-5" />,
    label: "Target country",
  },
  {
    id: "language",
    title: "What language for your resume?",
    subtitle: "Your resume will be written and formatted in this language.",
    icon: <Languages className="h-5 w-5" />,
    label: "Resume language",
  },
  {
    id: "role",
    title: "What's your target job role?",
    subtitle: "This helps our AI tailor your content and keywords.",
    icon: <Briefcase className="h-5 w-5" />,
    label: "Job role",
  },
  {
    id: "experience",
    title: "What's your experience level?",
    subtitle: "We'll adjust the resume structure to match your career stage.",
    icon: <BarChart2 className="h-5 w-5" />,
    label: "Experience level",
  },
  {
    id: "template",
    title: "Pick a starting template",
    subtitle: "You can always switch templates later in the builder.",
    icon: <Layout className="h-5 w-5" />,
    label: "Template",
  },
]

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [values, setValues] = useState({
    country: "",
    language: "en",
    role: "",
    experience: "",
    template: "modern",
  })

  const updateValue = (key: keyof typeof values) => (v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }))

  const stepKeys: (keyof typeof values)[] = [
    "country",
    "language",
    "role",
    "experience",
    "template",
  ]

  const currentValue = values[stepKeys[step]]
  const canProceed = currentValue.trim() !== ""

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
      return
    }
    // Final step — create resume and go to builder
    setIsCreating(true)
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${values.role || "My"} Resume`,
          languageCode: values.language,
          templateId: values.template,
          targetCountry: values.country,
        }),
      })
      if (res.ok) {
        const resume = await res.json()
        router.push(`/dashboard/builder/${resume.id}`)
      } else {
        router.push("/dashboard")
      }
    } catch {
      router.push("/dashboard")
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            GlobalResume<span className="text-blue-600">AI</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
        >
          Skip for now
        </button>
      </header>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 h-1">
        <div
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700">
              {STEPS[step].icon}
            </div>
            <span className="text-sm font-semibold text-blue-700">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-slate-400">— {STEPS[step].label}</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
            {STEPS[step].title}
          </h1>
          <p className="text-slate-500 mb-8">
            {STEPS[step].subtitle}
          </p>

          {/* Step content */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            {step === 0 && (
              <StepCountry value={values.country} onChange={updateValue("country")} />
            )}
            {step === 1 && (
              <StepLanguage value={values.language} onChange={updateValue("language")} />
            )}
            {step === 2 && (
              <StepJobRole value={values.role} onChange={updateValue("role")} />
            )}
            {step === 3 && (
              <StepExperience
                value={values.experience}
                onChange={updateValue("experience")}
              />
            )}
            {step === 4 && (
              <StepTemplate value={values.template} onChange={updateValue("template")} />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0 || isCreating}
              className="text-slate-500 hover:text-slate-700"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === step
                      ? "w-6 h-2 bg-blue-600"
                      : i < step
                      ? "w-2 h-2 bg-blue-300"
                      : "w-2 h-2 bg-slate-200"
                  )}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceed || isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 shadow-sm shadow-blue-600/25 disabled:opacity-40"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating&hellip;
                </>
              ) : step === STEPS.length - 1 ? (
                <>
                  Build my resume
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer hint */}
      <div className="text-center pb-8 text-xs text-slate-400">
        Your progress is saved automatically. You can always change these settings later.
      </div>
    </div>
  )
}
