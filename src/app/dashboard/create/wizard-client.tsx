"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronRight, ChevronLeft, Check, Upload, FileText,
  Sparkles, X, Loader2, ArrowUpFromLine, HardDrive,
  User, Briefcase, GraduationCap, Code, AlignLeft,
  AlertCircle, CheckCircle2, Info, Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"
import type { ParsedResume } from "@/lib/resume-parser"

// ── Types ──────────────────────────────────────────────────────────────────────

type ExperienceLevel = "none" | "lt3" | "3to5" | "5to10" | "gt10"
type StartMode = "upload" | "scratch"
type WizardStep = "experience" | "template" | "start" | "upload" | "parsing" | "review" | "contact"

interface TemplateFilter {
  style: string
  columns: string
  occupation: string
  language: string
}

interface ContactInfo {
  firstName: string
  lastName: string
  profession: string
  city: string
  country: string
  phone: string
  email: string
  linkedin: string
  website: string
}

type ParseProgress = {
  stage: "uploading" | "extracting" | "identifying" | "analyzing" | "ready" | "error"
  pct: number
  label: string
}

const PARSE_STAGES: ParseProgress[] = [
  { stage: "uploading", pct: 15, label: "Uploading file…" },
  { stage: "extracting", pct: 35, label: "Extracting text…" },
  { stage: "identifying", pct: 60, label: "Identifying sections…" },
  { stage: "analyzing", pct: 85, label: "Running ATS analysis…" },
  { stage: "ready", pct: 100, label: "Ready!" },
]

// ── Template Data ──────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: "modern", name: "Modern Sidebar", style: "Contemporary", columns: "2", recommended: ["lt3", "3to5"], plan: "FREE" },
  { id: "classic", name: "Classic Professional", style: "Traditional", columns: "1", recommended: ["3to5", "5to10", "gt10"], plan: "FREE" },
  { id: "executive", name: "Executive Premium", style: "Traditional", columns: "1", recommended: ["5to10", "gt10"], plan: "PRO" },
  { id: "minimal", name: "Minimal ATS", style: "Contemporary", columns: "1", recommended: ["none", "lt3", "3to5", "5to10", "gt10"], plan: "FREE" },
  { id: "creative", name: "Creative Accent", style: "Creative", columns: "2", recommended: ["none", "lt3", "3to5"], plan: "PRO" },
  { id: "ats-friendly", name: "ATS Friendly", style: "Traditional", columns: "1", recommended: ["none", "lt3", "3to5", "5to10", "gt10"], plan: "FREE" },
  { id: "german", name: "German Lebenslauf", style: "Traditional", columns: "1", recommended: ["5to10", "gt10"], plan: "GLOBAL" },
  { id: "french", name: "French CV", style: "Traditional", columns: "2", recommended: ["3to5", "5to10"], plan: "GLOBAL" },
  { id: "japanese", name: "Japanese Rirekisho", style: "Traditional", columns: "1", recommended: ["3to5", "5to10", "gt10"], plan: "GLOBAL" },
  { id: "spanish", name: "Spanish CV", style: "Contemporary", columns: "2", recommended: ["3to5", "5to10"], plan: "GLOBAL" },
  { id: "portuguese", name: "Portuguese CV", style: "Contemporary", columns: "2", recommended: ["3to5", "5to10"], plan: "GLOBAL" },
  { id: "global", name: "Global Professional", style: "Contemporary", columns: "1", recommended: ["5to10", "gt10"], plan: "PRO" },
]

const EXPERIENCE_OPTIONS: { id: ExperienceLevel; label: string; sub: string; icon: string }[] = [
  { id: "none", label: "No Experience", sub: "Student or fresh graduate", icon: "🎓" },
  { id: "lt3", label: "Less Than 3 Years", sub: "Early career professional", icon: "🌱" },
  { id: "3to5", label: "3–5 Years", sub: "Mid-level professional", icon: "📈" },
  { id: "5to10", label: "5–10 Years", sub: "Senior professional", icon: "💼" },
  { id: "gt10", label: "10+ Years", sub: "Executive level", icon: "🏆" },
]

const LANGUAGES = ["English", "German", "French", "Japanese", "Chinese", "Spanish", "Portuguese"]


// ── Mini Resume SVG Thumbnail ──────────────────────────────────────────────────

function TemplateSVG({ templateId, size = "sm" }: { templateId: string; size?: "sm" | "lg" }) {
  const configs: Record<string, { accent: string; header: string; bg: string; sidebar?: boolean }> = {
    modern: { accent: "#3B82F6", header: "#1E3A5F", bg: "#EFF6FF", sidebar: true },
    classic: { accent: "#374151", header: "#111827", bg: "#F9FAFB" },
    executive: { accent: "#D97706", header: "#0F172A", bg: "#FFFBEB" },
    minimal: { accent: "#94A3B8", header: "#334155", bg: "#F8FAFC" },
    creative: { accent: "#EC4899", header: "#831843", bg: "#FDF4FF", sidebar: true },
    "ats-friendly": { accent: "#1F2937", header: "#111827", bg: "#FFFFFF" },
    german: { accent: "#DC2626", header: "#1F2937", bg: "#FEF2F2" },
    french: { accent: "#2563EB", header: "#1E3A8A", bg: "#EFF6FF", sidebar: true },
    japanese: { accent: "#DC2626", header: "#991B1B", bg: "#FFF1F2" },
    spanish: { accent: "#C2410C", header: "#7C2D12", bg: "#FFF7ED" },
    portuguese: { accent: "#166534", header: "#14532D", bg: "#F0FDF4" },
    global: { accent: "#7C3AED", header: "#4C1D95", bg: "#F5F3FF" },
  }
  const c = configs[templateId] ?? configs.modern
  const isSm = size === "sm"
  const vw = isSm ? 120 : 200
  const vh = isSm ? 160 : 280

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={vw} height={vh} fill={c.bg} rx="3" />
      {c.sidebar ? (
        <>
          <rect width={vw * 0.32} height={vh} fill={c.header} />
          <circle cx={vw * 0.16} cy={vh * 0.12} r={vw * 0.09} fill="white" opacity="0.25" />
          <rect x={vw * 0.06} y={vh * 0.25} width={vw * 0.22} height={3} rx="1.5" fill="white" opacity="0.8" />
          <rect x={vw * 0.06} y={vh * 0.31} width={vw * 0.18} height={2} rx="1" fill="white" opacity="0.5" />
          <rect x={vw * 0.06} y={vh * 0.39} width={vw * 0.22} height={2} rx="1" fill="white" opacity="0.6" />
          <rect x={vw * 0.06} y={vh * 0.43} width={vw * 0.18} height={2} rx="1" fill="white" opacity="0.4" />
          <rect x={vw * 0.06} y={vh * 0.47} width={vw * 0.14} height={2} rx="1" fill="white" opacity="0.4" />
          <rect x={vw * 0.38} y={vh * 0.06} width={vw * 0.3} height={4} rx="2" fill={c.header} />
          <rect x={vw * 0.38} y={vh * 0.13} width={vw * 0.22} height={2.5} rx="1.25" fill="#94A3B8" />
          <rect x={vw * 0.38} y={vh * 0.21} width={vw * 0.24} height={2.5} rx="1.25" fill={c.accent} />
          <rect x={vw * 0.38} y={vh * 0.27} width={vw * 0.54} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.38} y={vh * 0.31} width={vw * 0.45} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.38} y={vh * 0.39} width={vw * 0.24} height={2.5} rx="1.25" fill={c.accent} />
          <rect x={vw * 0.38} y={vh * 0.45} width={vw * 0.54} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.38} y={vh * 0.49} width={vw * 0.4} height={1.5} rx="0.75" fill="#CBD5E1" />
        </>
      ) : (
        <>
          <rect width={vw} height={vh * 0.25} fill={c.header} />
          <circle cx={vw * 0.15} cy={vh * 0.125} r={vw * 0.07} fill="white" opacity="0.2" />
          <rect x={vw * 0.28} y={vh * 0.065} width={vw * 0.42} height={4} rx="2" fill="white" opacity="0.9" />
          <rect x={vw * 0.28} y={vh * 0.115} width={vw * 0.3} height={3} rx="1.5" fill="white" opacity="0.6" />
          <rect x={vw * 0.28} y={vh * 0.155} width={vw * 0.5} height={2} rx="1" fill="white" opacity="0.4" />
          <rect x={vw * 0.06} y={vh * 0.3} width={vw * 0.26} height={2.5} rx="1.25" fill={c.accent} />
          <rect x={vw * 0.06} y={vh * 0.37} width={vw * 0.88} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.06} y={vh * 0.41} width={vw * 0.75} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.06} y={vh * 0.45} width={vw * 0.88} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.06} y={vh * 0.52} width={vw * 0.26} height={2.5} rx="1.25" fill={c.accent} />
          <rect x={vw * 0.06} y={vh * 0.58} width={vw * 0.88} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.06} y={vh * 0.62} width={vw * 0.65} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.06} y={vh * 0.66} width={vw * 0.88} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.06} y={vh * 0.73} width={vw * 0.26} height={2.5} rx="1.25" fill={c.accent} />
          <rect x={vw * 0.06} y={vh * 0.79} width={vw * 0.35} height={5} rx="2.5" fill={c.accent} opacity="0.15" />
          <rect x={vw * 0.45} y={vh * 0.79} width={vw * 0.28} height={5} rx="2.5" fill={c.accent} opacity="0.15" />
          <rect x={vw * 0.06} y={vh * 0.88} width={vw * 0.26} height={2.5} rx="1.25" fill={c.accent} />
          <rect x={vw * 0.06} y={vh * 0.92} width={vw * 0.88} height={1.5} rx="0.75" fill="#CBD5E1" />
        </>
      )}
    </svg>
  )
}

// ── Live Resume Preview ────────────────────────────────────────────────────────

function LivePreviewPanel({ contact, templateId }: { contact: Partial<ContactInfo>; templateId: string }) {
  const configs: Record<string, { accent: string; header: string; bg: string }> = {
    modern: { accent: "#3B82F6", header: "#1E3A5F", bg: "#EFF6FF" },
    classic: { accent: "#374151", header: "#111827", bg: "#F9FAFB" },
    executive: { accent: "#D97706", header: "#0F172A", bg: "#FFFBEB" },
    minimal: { accent: "#94A3B8", header: "#334155", bg: "#F8FAFC" },
    default: { accent: "#3B82F6", header: "#1E3A5F", bg: "#F8FAFC" },
  }
  const c = configs[templateId] ?? configs.default
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Your Name"
  const profession = contact.profession || "Your Profession"
  const city = contact.city || ""
  const country = contact.country || ""
  const location = [city, country].filter(Boolean).join(", ")

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      <div style={{ backgroundColor: c.header }} className="p-4">
        <p className="text-white font-bold text-sm truncate">{name}</p>
        <p style={{ color: c.accent === "#374151" ? "#9CA3AF" : c.accent }} className="text-xs mt-0.5 truncate font-medium opacity-90">{profession}</p>
        {location && <p className="text-white/60 text-xs mt-1 truncate">{location}</p>}
        {contact.email && <p className="text-white/60 text-xs truncate">{contact.email}</p>}
      </div>
      <div className="p-3 space-y-2">
        <div>
          <div style={{ color: c.accent }} className="text-xs font-bold uppercase tracking-wide mb-1">Summary</div>
          <div className="space-y-1">
            <div className="h-1.5 rounded bg-slate-200 w-full" />
            <div className="h-1.5 rounded bg-slate-200 w-4/5" />
            <div className="h-1.5 rounded bg-slate-200 w-full" />
          </div>
        </div>
        <div>
          <div style={{ color: c.accent }} className="text-xs font-bold uppercase tracking-wide mb-1">Experience</div>
          <div className="space-y-1">
            <div className="h-1.5 rounded bg-slate-200 w-3/4" />
            <div className="h-1.5 rounded bg-slate-200 w-full" />
            <div className="h-1.5 rounded bg-slate-200 w-5/6" />
          </div>
        </div>
        <div>
          <div style={{ color: c.accent }} className="text-xs font-bold uppercase tracking-wide mb-1">Skills</div>
          <div className="flex flex-wrap gap-1">
            {["Skill 1", "Skill 2", "Skill 3"].map((s) => (
              <span key={s} style={{ backgroundColor: c.accent + "20", color: c.accent }} className="text-xs px-1.5 py-0.5 rounded text-[10px]">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Confidence Badge ───────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 80) return <Badge className="bg-emerald-100 text-emerald-700 text-xs">High confidence</Badge>
  if (score >= 50) return <Badge className="bg-amber-100 text-amber-700 text-xs">Medium confidence</Badge>
  return <Badge className="bg-red-100 text-red-700 text-xs">Low confidence</Badge>
}

// ── ATS Score Ring ─────────────────────────────────────────────────────────────

function AtsRing({ score }: { score: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 70 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444"
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="46" textAnchor="middle" className="text-lg font-bold" fontSize="18" fontWeight="700" fill="#0F172A">{score}</text>
      <text x="50" y="61" textAnchor="middle" fontSize="9" fill="#94A3B8">ATS Score</text>
    </svg>
  )
}

// ── Steps ──────────────────────────────────────────────────────────────────────

const WIZARD_PROGRESS_STEPS = [
  { id: "experience", label: "Experience", icon: <Briefcase className="h-4 w-4" /> },
  { id: "template", label: "Template", icon: <FileText className="h-4 w-4" /> },
  { id: "start", label: "Upload", icon: <Upload className="h-4 w-4" /> },
  { id: "contact", label: "Contact", icon: <User className="h-4 w-4" /> },
]

// ── Wizard Component ───────────────────────────────────────────────────────────

export function CreateWizard() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<WizardStep>("experience")
  const [experience, setExperience] = useState<ExperienceLevel | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("modern")
  const [startMode, setStartMode] = useState<StartMode | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [parseProgress, setParseProgress] = useState<ParseProgress>(PARSE_STAGES[0])
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [reviewTab, setReviewTab] = useState<"contact" | "experience" | "education" | "skills">("contact")
  const [filters, setFilters] = useState<TemplateFilter>({ style: "Any", columns: "Any", occupation: "Any", language: "English" })
  const [contact, setContact] = useState<ContactInfo>({
    firstName: "", lastName: "", profession: "", city: "", country: "", phone: "", email: "", linkedin: "", website: "",
  })

  // Map progress step id to index for the top tracker
  const progressStepIndex = WIZARD_PROGRESS_STEPS.findIndex((s) =>
    s.id === step ||
    (step === "parsing" && s.id === "start") ||
    (step === "review" && s.id === "start")
  )

  const filteredTemplates = TEMPLATES.filter((t) => {
    if (filters.style !== "Any" && t.style !== filters.style) return false
    if (filters.columns !== "Any" && t.columns !== filters.columns) return false
    return true
  })

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setUploadedFile(file)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setUploadedFile(file)
  }

  const runParse = async (file: File) => {
    setStep("parsing")
    setParseError(null)

    // Animate progress stages
    const stageDelay = 600
    for (let i = 0; i < PARSE_STAGES.length - 1; i++) {
      setParseProgress(PARSE_STAGES[i])
      await new Promise((r) => setTimeout(r, stageDelay))
    }

    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/resume/import", { method: "POST", body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Parse failed")

      const parsed: ParsedResume = json.data
      setParsedResume(parsed)

      // Auto-fill contact
      const nameParts = parsed.contact.fullName?.split(" ") || []
      setContact({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        profession: parsed.contact.jobTitle || "",
        city: parsed.contact.location?.split(",")[0]?.trim() || "",
        country: parsed.contact.location?.split(",")[1]?.trim() || "",
        phone: parsed.contact.phone || "",
        email: parsed.contact.email || "",
        linkedin: parsed.contact.linkedin || "",
        website: parsed.contact.website || "",
      })

      setParseProgress(PARSE_STAGES[PARSE_STAGES.length - 1])
      await new Promise((r) => setTimeout(r, 600))
      setStep("review")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setParseError(msg)
      setParseProgress({ stage: "error", pct: 0, label: "Parsing failed" })
    }
  }

  const handleFinish = async () => {
    setIsCreating(true)
    try {
      const experienceSections = parsedResume?.experience.map((e, i) => ({
        type: "EXPERIENCE",
        content: e,
        order: i + 1,
      })) || []

      const educationSections = parsedResume?.education.map((e, i) => ({
        type: "EDUCATION",
        content: e,
        order: 100 + i,
      })) || []

      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contact.firstName ? `${contact.firstName}'s Resume` : "My Resume",
          languageCode: filters.language === "English" ? "en"
            : filters.language === "German" ? "de"
            : filters.language === "French" ? "fr"
            : filters.language === "Japanese" ? "ja"
            : filters.language === "Spanish" ? "es"
            : filters.language === "Portuguese" ? "pt"
            : "en",
          templateId: selectedTemplate,
          targetCountry: "US",
          sections: [
            { type: "CONTACT", content: contact, order: 0 },
            ...(parsedResume?.summary ? [{ type: "SUMMARY", content: { text: parsedResume.summary }, order: 1 }] : []),
            ...experienceSections,
            ...educationSections,
            ...(parsedResume?.skills.all.length ? [{ type: "SKILLS", content: { items: parsedResume.skills.all }, order: 200 }] : []),
          ],
        }),
      })
      if (!res.ok) throw new Error("Failed to create resume")
      const created = await res.json()
      toast("Resume created with imported data!", "success")
      router.push(`/dashboard/builder/${created.id}`)
    } catch {
      toast("Failed to create resume. Please try again.", "error")
    } finally {
      setIsCreating(false)
    }
  }

  const canNext = (): boolean => {
    if (step === "experience") return experience !== null
    if (step === "template") return true
    if (step === "start") return startMode !== null
    if (step === "upload") return uploadedFile !== null
    if (step === "review") return true
    return true
  }

  const next = () => {
    if (step === "experience") setStep("template")
    else if (step === "template") setStep("start")
    else if (step === "start") {
      if (startMode === "upload") setStep("upload")
      else setStep("contact")
    }
    else if (step === "upload") runParse(uploadedFile!)
    else if (step === "review") setStep("contact")
    else if (step === "contact") handleFinish()
  }

  const back = () => {
    if (step === "template") setStep("experience")
    else if (step === "start") setStep("template")
    else if (step === "upload") setStep("start")
    else if (step === "parsing") setStep("upload")
    else if (step === "review") setStep("upload")
    else if (step === "contact") setStep(startMode === "upload" ? "review" : "start")
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 flex flex-col">
      {/* Progress bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            {WIZARD_PROGRESS_STEPS.map((s, i) => {
              const isActive = s.id === step || (step === "parsing" && s.id === "start") || (step === "review" && s.id === "start")
              const isDone = i < progressStepIndex
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                    isDone ? "bg-emerald-100 text-emerald-700" : isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {isDone ? <Check className="h-3.5 w-3.5" /> : s.icon}
                    {s.label}
                  </div>
                  {i < WIZARD_PROGRESS_STEPS.length - 1 && (
                    <div className={cn("h-px w-8 transition-colors", isDone ? "bg-emerald-300" : "bg-slate-200")} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl">

          {/* Step 1: Experience */}
          {step === "experience" && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">How long have you been working?</h1>
                <p className="text-slate-500 mt-2">We&apos;ll recommend the best resume formats for your level.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setExperience(opt.id)}
                    className={cn(
                      "group p-5 rounded-2xl border-2 text-left transition-all duration-200",
                      experience === opt.id
                        ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                    )}
                  >
                    <div className="text-3xl mb-3">{opt.icon}</div>
                    <p className={cn("font-bold text-sm", experience === opt.id ? "text-blue-700" : "text-slate-900")}>{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{opt.sub}</p>
                    {experience === opt.id && (
                      <div className="mt-3 h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Template selection */}
          {step === "template" && (
            <div>
              <div className="text-center mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Choose your template</h1>
                <p className="text-slate-500 mt-2">
                  {experience ? `Showing recommended templates for ${EXPERIENCE_OPTIONS.find((e) => e.id === experience)?.label}` : "Browse all templates"}
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Style:</Label>
                  <div className="flex gap-1">
                    {["Any", "Traditional", "Contemporary", "Creative"].map((s) => (
                      <button key={s} onClick={() => setFilters((f) => ({ ...f, style: s }))}
                        className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                          filters.style === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Columns:</Label>
                  <div className="flex gap-1">
                    {["Any", "1", "2"].map((c) => (
                      <button key={c} onClick={() => setFilters((f) => ({ ...f, columns: c }))}
                        className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                          filters.columns === c ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}>
                        {c === "Any" ? "Any" : `${c} col`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Language:</Label>
                  <select
                    value={filters.language}
                    onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                  >
                    {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Template grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTemplates.map((t) => {
                  const isRec = experience && t.recommended.includes(experience)
                  const isSelected = selectedTemplate === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={cn(
                        "group relative rounded-xl border-2 overflow-hidden text-left transition-all duration-200",
                        isSelected ? "border-blue-500 shadow-lg shadow-blue-100" : "border-slate-200 hover:border-blue-300 hover:shadow-md"
                      )}
                    >
                      {isRec && (
                        <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" />Recommended
                        </div>
                      )}
                      {t.plan !== "FREE" && (
                        <div className={cn("absolute top-2 right-2 z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          t.plan === "PRO" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {t.plan}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute bottom-2 right-2 z-10 h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className="h-36 bg-slate-50">
                        <TemplateSVG templateId={t.id} />
                      </div>
                      <div className="p-2.5 bg-white">
                        <p className={cn("text-xs font-semibold truncate", isSelected ? "text-blue-700" : "text-slate-800")}>{t.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t.style} · {t.columns} col</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Upload or scratch */}
          {step === "start" && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Do you have an existing resume?</h1>
                <p className="text-slate-500 mt-2">We can import your existing resume or start fresh.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
                <button
                  onClick={() => setStartMode("upload")}
                  className={cn(
                    "group p-8 rounded-2xl border-2 text-center transition-all duration-200",
                    startMode === "upload"
                      ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                  )}
                >
                  <div className={cn("h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                    startMode === "upload" ? "bg-blue-600" : "bg-slate-100 group-hover:bg-blue-100"
                  )}>
                    <ArrowUpFromLine className={cn("h-7 w-7", startMode === "upload" ? "text-white" : "text-slate-500 group-hover:text-blue-600")} />
                  </div>
                  <p className={cn("font-bold text-base mb-1.5", startMode === "upload" ? "text-blue-700" : "text-slate-900")}>
                    Yes, upload my resume
                  </p>
                  <p className="text-sm text-slate-500">Import from PDF, Word, or Google Docs</p>
                  <p className="text-xs text-slate-400 mt-2">PDF, DOC, DOCX, RTF, TXT</p>
                </button>

                <button
                  onClick={() => setStartMode("scratch")}
                  className={cn(
                    "group p-8 rounded-2xl border-2 text-center transition-all duration-200",
                    startMode === "scratch"
                      ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                  )}
                >
                  <div className={cn("h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                    startMode === "scratch" ? "bg-blue-600" : "bg-slate-100 group-hover:bg-blue-100"
                  )}>
                    <AlignLeft className={cn("h-7 w-7", startMode === "scratch" ? "text-white" : "text-slate-500 group-hover:text-blue-600")} />
                  </div>
                  <p className={cn("font-bold text-base mb-1.5", startMode === "scratch" ? "text-blue-700" : "text-slate-900")}>
                    No, start from scratch
                  </p>
                  <p className="text-sm text-slate-500">Build step-by-step with AI guidance</p>
                  <p className="text-xs text-slate-400 mt-2">Guided wizard with AI suggestions</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: File upload */}
          {step === "upload" && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Upload your resume</h1>
                <p className="text-slate-500 mt-2">We&apos;ll extract your information automatically.</p>
              </div>
              <div className="max-w-xl mx-auto space-y-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200",
                    isDragging ? "border-blue-500 bg-blue-50" : uploadedFile ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                  )}
                >
                  {uploadedFile ? (
                    <div>
                      <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                        <Check className="h-7 w-7 text-emerald-600" />
                      </div>
                      <p className="font-semibold text-emerald-700">{uploadedFile.name}</p>
                      <p className="text-sm text-slate-500 mt-1">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                      <button
                        onClick={() => setUploadedFile(null)}
                        className="mt-3 text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 mx-auto"
                      >
                        <X className="h-3 w-3" />Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <Upload className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="font-semibold text-slate-700 mb-1">Drag & drop your resume</p>
                      <p className="text-sm text-slate-500 mb-4">or click to browse files</p>
                      <label className="cursor-pointer">
                        <input type="file" accept=".pdf,.doc,.docx,.rtf,.txt,.html" onChange={handleFileInput} className="hidden" />
                        <span className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">
                          Browse Files
                        </span>
                      </label>
                      <p className="text-xs text-slate-400 mt-4">PDF, DOC, DOCX, RTF, TXT, HTML — max 10MB</p>
                    </div>
                  )}
                </div>

                {/* Cloud options */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">or import from</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Google Drive", icon: <HardDrive className="h-4 w-4" />, color: "text-blue-600" },
                    { name: "Dropbox", icon: <HardDrive className="h-4 w-4" />, color: "text-indigo-600" },
                  ].map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => toast("Coming soon — connect your cloud storage", "info")}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all text-sm font-medium text-slate-700"
                    >
                      <span className={opt.color}>{opt.icon}</span>
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Parsing progress */}
          {step === "parsing" && (
            <div className="max-w-md mx-auto text-center">
              <div className="mb-8">
                {parseProgress.stage === "error" ? (
                  <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                  </div>
                ) : parseProgress.stage === "ready" ? (
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                  </div>
                )}
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {parseProgress.stage === "error" ? "Parsing Failed" : parseProgress.stage === "ready" ? "Done!" : "Analyzing your resume…"}
                </h1>
                <p className="text-slate-500 text-sm">{parseProgress.label}</p>
              </div>

              {parseProgress.stage !== "error" && (
                <div className="space-y-3 mb-6">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-700"
                      style={{ width: `${parseProgress.pct}%` }}
                    />
                  </div>
                  <div className="space-y-2">
                    {PARSE_STAGES.map((s) => {
                      const done = PARSE_STAGES.indexOf(parseProgress) > PARSE_STAGES.indexOf(s) || parseProgress.stage === "ready"
                      const active = parseProgress.stage === s.stage
                      return (
                        <div key={s.stage} className="flex items-center gap-2 text-sm">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : active ? (
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-slate-200 shrink-0" />
                          )}
                          <span className={cn(done ? "text-emerald-600" : active ? "text-blue-700 font-medium" : "text-slate-400")}>
                            {s.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {parseProgress.stage === "error" && parseError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left space-y-3">
                  <p className="text-sm text-red-700">{parseError}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setParseError(null); setStep("upload") }} className="text-xs border-red-200 text-red-700">
                      Try another file
                    </Button>
                    <Button size="sm" onClick={() => { setStartMode("scratch"); setStep("contact") }} className="text-xs bg-blue-600 hover:bg-blue-700">
                      Start from scratch
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review parsed data */}
          {step === "review" && parsedResume && (
            <div>
              <div className="text-center mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Review your imported resume</h1>
                <p className="text-slate-500 mt-2">We found the following information. Review and confirm before continuing.</p>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: tabs */}
                <div className="xl:col-span-2 space-y-4">
                  {/* Overall confidence */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900 text-sm">Import Confidence</p>
                        <ConfidenceBadge score={parsedResume.confidence.overall} />
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${parsedResume.confidence.overall}%` }} />
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900 shrink-0">{parsedResume.confidence.overall}%</span>
                  </div>

                  {/* Tab nav */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="flex border-b border-slate-100">
                      {[
                        { id: "contact" as const, label: "Contact", icon: <User className="h-3.5 w-3.5" />, conf: parsedResume.confidence.contact },
                        { id: "experience" as const, label: "Experience", icon: <Briefcase className="h-3.5 w-3.5" />, conf: parsedResume.confidence.experience },
                        { id: "education" as const, label: "Education", icon: <GraduationCap className="h-3.5 w-3.5" />, conf: parsedResume.confidence.education },
                        { id: "skills" as const, label: "Skills", icon: <Code className="h-3.5 w-3.5" />, conf: parsedResume.confidence.skills },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setReviewTab(tab.id)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors border-b-2",
                            reviewTab === tab.id
                              ? "border-blue-600 text-blue-700 bg-blue-50/50"
                              : "border-transparent text-slate-500 hover:text-slate-700"
                          )}
                        >
                          {tab.icon}
                          {tab.label}
                          <span className={cn("ml-1 text-[10px] font-bold px-1 py-0.5 rounded",
                            tab.conf >= 70 ? "bg-emerald-100 text-emerald-700"
                              : tab.conf >= 40 ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          )}>{tab.conf}%</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-5">
                      {/* Contact tab */}
                      {reviewTab === "contact" && (
                        <div className="space-y-3">
                          {[
                            { label: "Full Name", value: parsedResume.contact.fullName },
                            { label: "Job Title", value: parsedResume.contact.jobTitle },
                            { label: "Email", value: parsedResume.contact.email },
                            { label: "Phone", value: parsedResume.contact.phone },
                            { label: "Location", value: parsedResume.contact.location },
                            { label: "LinkedIn", value: parsedResume.contact.linkedin },
                            { label: "GitHub", value: parsedResume.contact.github },
                            { label: "Website", value: parsedResume.contact.website },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex items-start gap-3">
                              <span className="text-xs font-semibold text-slate-500 w-20 shrink-0 pt-0.5">{label}</span>
                              {value ? (
                                <span className="text-sm text-slate-900 flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  {value}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-400 flex items-center gap-1.5">
                                  <AlertCircle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                  Not found
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Experience tab */}
                      {reviewTab === "experience" && (
                        <div className="space-y-4">
                          {parsedResume.experience.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                              <Briefcase className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                              <p className="text-sm">No work experience detected</p>
                              <p className="text-xs text-slate-400 mt-1">You can add it manually in the builder</p>
                            </div>
                          ) : parsedResume.experience.map((exp, i) => (
                            <div key={i} className="border border-slate-100 rounded-xl p-4">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">{exp.title || "Unknown Title"}</p>
                                  <p className="text-xs text-slate-500">{exp.company || "Unknown Company"}</p>
                                </div>
                                {exp.current && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Current</Badge>}
                              </div>
                              {(exp.startDate || exp.endDate) && (
                                <p className="text-xs text-slate-400 mb-2">{exp.startDate} – {exp.endDate}</p>
                              )}
                              {exp.bullets.length > 0 && (
                                <ul className="space-y-1">
                                  {exp.bullets.slice(0, 3).map((b, j) => (
                                    <li key={j} className="text-xs text-slate-600 flex gap-1.5">
                                      <span className="text-slate-300 shrink-0">•</span>{b}
                                    </li>
                                  ))}
                                  {exp.bullets.length > 3 && <li className="text-xs text-slate-400">+{exp.bullets.length - 3} more…</li>}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Education tab */}
                      {reviewTab === "education" && (
                        <div className="space-y-4">
                          {parsedResume.education.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                              <GraduationCap className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                              <p className="text-sm">No education detected</p>
                              <p className="text-xs text-slate-400 mt-1">You can add it manually in the builder</p>
                            </div>
                          ) : parsedResume.education.map((edu, i) => (
                            <div key={i} className="border border-slate-100 rounded-xl p-4">
                              <p className="font-semibold text-slate-900 text-sm">{edu.institution || "Unknown Institution"}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{[edu.degree, edu.field].filter(Boolean).join(" in ") || "Unknown Degree"}</p>
                              {(edu.startDate || edu.endDate) && (
                                <p className="text-xs text-slate-400 mt-1">{edu.startDate} – {edu.endDate}</p>
                              )}
                              {edu.gpa && <p className="text-xs text-slate-500 mt-1">GPA: {edu.gpa}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Skills tab */}
                      {reviewTab === "skills" && (
                        <div className="space-y-4">
                          {parsedResume.skills.all.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                              <Code className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                              <p className="text-sm">No skills detected</p>
                              <p className="text-xs text-slate-400 mt-1">You can add them manually in the builder</p>
                            </div>
                          ) : (
                            <>
                              {parsedResume.skills.technical.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Technical</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {parsedResume.skills.technical.map((s) => (
                                      <Badge key={s} className="bg-blue-100 text-blue-700 text-xs">{s}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {parsedResume.skills.tools.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tools & Other</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {parsedResume.skills.tools.map((s) => (
                                      <Badge key={s} className="bg-slate-100 text-slate-600 text-xs">{s}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {parsedResume.skills.soft.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Soft Skills</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {parsedResume.skills.soft.map((s) => (
                                      <Badge key={s} className="bg-purple-100 text-purple-700 text-xs">{s}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: ATS panel */}
                <div className="space-y-4">
                  {/* ATS score */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />ATS Analysis
                    </h3>
                    <div className="flex justify-center mb-4">
                      <AtsRing score={parsedResume.ats.score} />
                    </div>
                    {parsedResume.ats.missing.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />Missing sections
                        </p>
                        <ul className="space-y-1">
                          {parsedResume.ats.missing.map((m) => (
                            <li key={m} className="text-xs text-slate-600 flex gap-1.5">
                              <span className="text-red-400">•</span>{m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {parsedResume.ats.suggestions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-blue-600 mb-1.5 flex items-center gap-1">
                          <Info className="h-3.5 w-3.5" />Suggestions
                        </p>
                        <ul className="space-y-1.5">
                          {parsedResume.ats.suggestions.slice(0, 4).map((s) => (
                            <li key={s} className="text-xs text-slate-600 flex gap-1.5">
                              <span className="text-blue-400 shrink-0">→</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>File type</span>
                      <span className="font-semibold text-slate-700 uppercase">{parsedResume.fileType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pages detected</span>
                      <span className="font-semibold text-slate-700">{parsedResume.pageCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sections found</span>
                      <span className="font-semibold text-slate-700">
                        {[parsedResume.experience.length > 0, parsedResume.education.length > 0, parsedResume.skills.all.length > 0, !!parsedResume.summary].filter(Boolean).length + 1}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Contact info */}
          {step === "contact" && (
            <div>
              <div className="text-center mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Let&apos;s confirm your contact information</h1>
                <p className="text-slate-500 mt-2">This will appear at the top of your resume.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Form */}
                <div className="lg:col-span-3">
                  {uploadedFile && parsedResume && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-sm font-medium text-emerald-700">
                        Auto-filled from {uploadedFile.name} · {parsedResume.confidence.overall}% confidence
                      </span>
                    </div>
                  )}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">First Name *</Label>
                        <Input value={contact.firstName} onChange={(e) => setContact((c) => ({ ...c, firstName: e.target.value }))} placeholder="Jane" className="h-10 border-slate-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Last Name *</Label>
                        <Input value={contact.lastName} onChange={(e) => setContact((c) => ({ ...c, lastName: e.target.value }))} placeholder="Smith" className="h-10 border-slate-200" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Profession / Job Title</Label>
                      <Input value={contact.profession} onChange={(e) => setContact((c) => ({ ...c, profession: e.target.value }))} placeholder="Software Engineer" className="h-10 border-slate-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">City</Label>
                        <Input value={contact.city} onChange={(e) => setContact((c) => ({ ...c, city: e.target.value }))} placeholder="Berlin" className="h-10 border-slate-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Country</Label>
                        <Input value={contact.country} onChange={(e) => setContact((c) => ({ ...c, country: e.target.value }))} placeholder="Germany" className="h-10 border-slate-200" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Phone</Label>
                        <Input value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} placeholder="+49 123 456 789" className="h-10 border-slate-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Email *</Label>
                        <Input type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} placeholder="jane@example.com" className="h-10 border-slate-200" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">LinkedIn URL</Label>
                      <Input value={contact.linkedin} onChange={(e) => setContact((c) => ({ ...c, linkedin: e.target.value }))} placeholder="linkedin.com/in/janesmith" className="h-10 border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Website / Portfolio</Label>
                      <Input value={contact.website} onChange={(e) => setContact((c) => ({ ...c, website: e.target.value }))} placeholder="janesmith.dev" className="h-10 border-slate-200" />
                    </div>
                  </div>
                </div>

                {/* Live preview */}
                <div className="lg:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Live Preview</p>
                  <div className="h-72">
                    <LivePreviewPanel contact={contact} templateId={selectedTemplate} />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Template: <span className="font-semibold capitalize text-slate-700">{selectedTemplate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          {step !== "parsing" && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
              {step !== "experience" ? (
                <Button variant="outline" onClick={back} className="border-slate-200">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                onClick={next}
                disabled={!canNext() || isCreating}
                className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
              >
                {isCreating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
                ) : step === "upload" ? (
                  <>Import Resume <ChevronRight className="h-4 w-4 ml-1" /></>
                ) : step === "review" ? (
                  <>Looks Good <ChevronRight className="h-4 w-4 ml-1" /></>
                ) : step === "contact" ? (
                  <>Continue to Builder <ChevronRight className="h-4 w-4 ml-1" /></>
                ) : (
                  <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
