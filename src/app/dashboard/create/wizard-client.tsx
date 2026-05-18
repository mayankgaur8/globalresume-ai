"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronRight, ChevronLeft, Check, Upload, FileText,
  Sparkles, X, Loader2, HardDrive,
  User, Briefcase, GraduationCap, AlignLeft,
  AlertCircle, CheckCircle2, Info, Zap, Code,
  ClipboardPaste, RotateCcw, ChevronDown, ChevronUp, Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"
import type { ParsedResume, ATSBreakdown, AISuggestion, ParsedEducation } from "@/lib/resume-parser"
import type { ParsedContact } from "@/lib/resume-parser"

// ── Types ─────────────────────────────────────────────────────────────────────

type ExperienceLevel = "none" | "lt3" | "3to5" | "5to10" | "gt10"
type WizardStep = "experience" | "template" | "upload" | "parsing" | "review" | "contact"
type UploadMode = "file" | "paste"
type ReviewTab = "contact" | "summary" | "experience" | "education" | "skills" | "aicoach"

type FilterTag = "all" | "free" | "ats-safe" | "with-photo" | "no-photo" | "one-col" | "two-col" | "tech" | "europe" | "creative" | "academic" | "executive" | "pro" | "global"

interface TemplateFilter { activeTag: FilterTag; language: string }

interface ContactInfo {
  firstName: string; lastName: string; profession: string
  city: string; country: string; phone: string; email: string
  linkedin: string; website: string
}

type ParseStage = "uploading" | "extracting" | "identifying" | "analyzing" | "ready" | "error"

interface ParseProgress { stage: ParseStage; pct: number; label: string }

const PARSE_STAGES: ParseProgress[] = [
  { stage: "uploading",   pct: 15,  label: "Uploading file…"        },
  { stage: "extracting",  pct: 35,  label: "Extracting text…"        },
  { stage: "identifying", pct: 60,  label: "Detecting sections…"     },
  { stage: "analyzing",   pct: 85,  label: "Running ATS analysis…"   },
  { stage: "ready",       pct: 100, label: "Ready!"                  },
]

// ── Template Data ─────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: "modern",          name: "Modern Sidebar",       style: "Contemporary", columns: "2", recommended: ["lt3", "3to5"],              plan: "FREE",   tags: ["free", "two-col"]                            as FilterTag[] },
  { id: "classic",         name: "Classic Professional", style: "Traditional",  columns: "1", recommended: ["3to5", "5to10", "gt10"],    plan: "FREE",   tags: ["free", "ats-safe", "one-col", "no-photo"]    as FilterTag[] },
  { id: "minimal",         name: "Minimal ATS",          style: "Contemporary", columns: "1", recommended: ["none", "lt3", "3to5", "5to10", "gt10"], plan: "FREE", tags: ["free", "ats-safe", "one-col", "no-photo"] as FilterTag[] },
  { id: "ats-friendly",    name: "ATS Friendly",         style: "Traditional",  columns: "1", recommended: ["none", "lt3", "3to5", "5to10", "gt10"], plan: "FREE", tags: ["free", "ats-safe", "one-col", "no-photo"] as FilterTag[] },
  { id: "executive",       name: "Executive Premium",    style: "Traditional",  columns: "1", recommended: ["5to10", "gt10"],            plan: "PRO",    tags: ["pro", "executive", "one-col", "no-photo"]    as FilterTag[] },
  { id: "creative",        name: "Creative Accent",      style: "Creative",     columns: "2", recommended: ["none", "lt3", "3to5"],      plan: "PRO",    tags: ["pro", "creative", "two-col", "with-photo"]   as FilterTag[] },
  { id: "global",          name: "Global Professional",  style: "Contemporary", columns: "1", recommended: ["5to10", "gt10"],            plan: "PRO",    tags: ["pro", "one-col", "no-photo"]                 as FilterTag[] },
  { id: "global-tech",     name: "Global Tech",          style: "Contemporary", columns: "2", recommended: ["lt3", "3to5", "5to10"],     plan: "PRO",    tags: ["pro", "tech", "two-col", "no-photo"]         as FilterTag[] },
  { id: "consultant-pro",  name: "Consultant Pro",       style: "Traditional",  columns: "1", recommended: ["5to10", "gt10"],            plan: "PRO",    tags: ["pro", "executive", "one-col", "no-photo"]    as FilterTag[] },
  { id: "academic",        name: "Academic CV",          style: "Traditional",  columns: "1", recommended: ["3to5", "5to10", "gt10"],    plan: "PRO",    tags: ["pro", "academic", "one-col", "no-photo"]     as FilterTag[] },
  { id: "german",          name: "German Lebenslauf",    style: "Traditional",  columns: "1", recommended: ["5to10", "gt10"],            plan: "GLOBAL", tags: ["global", "europe", "one-col", "with-photo"]  as FilterTag[] },
  { id: "french",          name: "French CV",            style: "Traditional",  columns: "2", recommended: ["3to5", "5to10"],            plan: "GLOBAL", tags: ["global", "europe", "two-col", "with-photo"]  as FilterTag[] },
  { id: "japanese",        name: "Japanese Rirekisho",   style: "Traditional",  columns: "1", recommended: ["3to5", "5to10", "gt10"],    plan: "GLOBAL", tags: ["global", "one-col", "with-photo"]             as FilterTag[] },
  { id: "spanish",         name: "Spanish CV",           style: "Contemporary", columns: "2", recommended: ["3to5", "5to10"],            plan: "GLOBAL", tags: ["global", "europe", "two-col", "with-photo"]  as FilterTag[] },
  { id: "portuguese",      name: "Portuguese CV",        style: "Contemporary", columns: "2", recommended: ["3to5", "5to10"],            plan: "GLOBAL", tags: ["global", "two-col", "with-photo"]             as FilterTag[] },
  { id: "uae-pro",         name: "UAE Professional",     style: "Contemporary", columns: "1", recommended: ["3to5", "5to10"],            plan: "GLOBAL", tags: ["global", "one-col", "with-photo"]             as FilterTag[] },
  { id: "euro-card",       name: "EU Blue Card",         style: "Traditional",  columns: "1", recommended: ["3to5", "5to10", "gt10"],    plan: "GLOBAL", tags: ["global", "europe", "ats-safe", "one-col", "no-photo"] as FilterTag[] },
]

// ATS safety tiers per template
const TEMPLATE_ATS_SAFETY: Record<string, "safe" | "friendly" | "not-safe"> = {
  minimal:          "safe",
  "ats-friendly":   "safe",
  classic:          "safe",
  "euro-card":      "safe",
  modern:           "friendly",
  executive:        "friendly",
  global:           "friendly",
  "global-tech":    "friendly",
  "consultant-pro": "friendly",
  academic:         "friendly",
  french:           "friendly",
  portuguese:       "friendly",
  spanish:          "friendly",
  "uae-pro":        "friendly",
  japanese:         "friendly",
  german:           "friendly",
  creative:         "not-safe",
}

const TEMPLATE_COUNTRY: Record<string, string> = {
  german:     "DE/AT/CH",
  french:     "FR/BE",
  japanese:   "JP",
  spanish:    "ES/LATAM",
  portuguese: "PT/BR",
  "uae-pro":  "UAE/GCC",
  "euro-card":"EU",
}

const PHOTO_TEMPLATES = new Set(["german", "french", "japanese", "creative", "spanish", "portuguese", "uae-pro"])

const QUICK_DEGREES: { label: string; degree: string; field: string }[] = [
  { label: "B.Tech / BE",   degree: "Bachelor of Technology",           field: "Engineering"          },
  { label: "MCA",           degree: "Master of Computer Applications",   field: "Computer Science"     },
  { label: "MBA",           degree: "Master of Business Administration", field: "Business"             },
  { label: "M.Tech",        degree: "Master of Technology",              field: "Engineering"          },
  { label: "BCA",           degree: "Bachelor of Computer Applications", field: "Computer Science"     },
  { label: "Bachelor's",    degree: "Bachelor's Degree",                 field: ""                     },
  { label: "Master's",      degree: "Master's Degree",                   field: ""                     },
  { label: "Diploma",       degree: "Diploma",                           field: ""                     },
  { label: "PhD",           degree: "Doctor of Philosophy",              field: ""                     },
]

const EXPERIENCE_OPTIONS = [
  { id: "none"  as ExperienceLevel, label: "No Experience",    sub: "Student or fresh graduate", icon: "🎓" },
  { id: "lt3"   as ExperienceLevel, label: "Less Than 3 Years",sub: "Early career professional", icon: "🌱" },
  { id: "3to5"  as ExperienceLevel, label: "3–5 Years",        sub: "Mid-level professional",   icon: "📈" },
  { id: "5to10" as ExperienceLevel, label: "5–10 Years",       sub: "Senior professional",      icon: "💼" },
  { id: "gt10"  as ExperienceLevel, label: "10+ Years",        sub: "Executive level",          icon: "🏆" },
]

const LANGUAGES = ["English", "German", "French", "Japanese", "Chinese", "Spanish", "Portuguese"]

// ── Template SVG ──────────────────────────────────────────────────────────────

function TemplateSVG({ templateId }: { templateId: string }) {
  const configs: Record<string, { accent: string; header: string; bg: string; sidebar?: boolean }> = {
    modern:           { accent: "#3B82F6", header: "#1E3A5F", bg: "#EFF6FF", sidebar: true },
    classic:          { accent: "#374151", header: "#111827", bg: "#F9FAFB" },
    executive:        { accent: "#D97706", header: "#0F172A", bg: "#FFFBEB" },
    minimal:          { accent: "#94A3B8", header: "#334155", bg: "#F8FAFC" },
    creative:         { accent: "#EC4899", header: "#831843", bg: "#FDF4FF", sidebar: true },
    "ats-friendly":   { accent: "#1F2937", header: "#111827", bg: "#FFFFFF" },
    german:           { accent: "#DC2626", header: "#1F2937", bg: "#FEF2F2" },
    french:           { accent: "#2563EB", header: "#1E3A8A", bg: "#EFF6FF", sidebar: true },
    japanese:         { accent: "#DC2626", header: "#991B1B", bg: "#FFF1F2" },
    spanish:          { accent: "#C2410C", header: "#7C2D12", bg: "#FFF7ED", sidebar: true },
    portuguese:       { accent: "#166534", header: "#14532D", bg: "#F0FDF4", sidebar: true },
    global:           { accent: "#7C3AED", header: "#4C1D95", bg: "#F5F3FF" },
    "global-tech":    { accent: "#0D9488", header: "#134E4A", bg: "#F0FDFA", sidebar: true },
    "consultant-pro": { accent: "#D97706", header: "#1C1917", bg: "#FFFBEB" },
    academic:         { accent: "#4B5563", header: "#1F2937", bg: "#F9FAFB" },
    "uae-pro":        { accent: "#0369A1", header: "#1E3A5F", bg: "#EFF6FF" },
    "euro-card":      { accent: "#1D4ED8", header: "#1E3A8A", bg: "#EFF6FF" },
  }
  const c = configs[templateId] ?? configs.modern
  const hasPhoto = PHOTO_TEMPLATES.has(templateId)
  const vw = 120; const vh = 160
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={vw} height={vh} fill={c.bg} rx="3" />
      {c.sidebar ? (
        <>
          <rect width={vw * 0.32} height={vh} fill={c.header} />
          {/* Photo circle — prominent for photo templates, subtle for others */}
          <circle cx={vw * 0.16} cy={vh * 0.12} r={vw * 0.09} fill="white" opacity={hasPhoto ? "0.9" : "0.2"} />
          {hasPhoto && (
            <>
              <circle cx={vw * 0.16} cy={vh * 0.105} r={vw * 0.04} fill={c.header} opacity="0.4" />
              <ellipse cx={vw * 0.16} cy={vh * 0.155} rx={vw * 0.065} ry={vw * 0.04} fill={c.header} opacity="0.25" />
            </>
          )}
          <rect x={vw * 0.06} y={vh * 0.25} width={vw * 0.22} height={3} rx="1.5" fill="white" opacity="0.8" />
          <rect x={vw * 0.06} y={vh * 0.31} width={vw * 0.18} height={2} rx="1" fill="white" opacity="0.5" />
          <rect x={vw * 0.38} y={vh * 0.06} width={vw * 0.3}  height={4} rx="2" fill={c.header} />
          <rect x={vw * 0.38} y={vh * 0.13} width={vw * 0.22} height={2.5} rx="1.25" fill="#94A3B8" />
          <rect x={vw * 0.38} y={vh * 0.21} width={vw * 0.24} height={2.5} rx="1.25" fill={c.accent} />
          <rect x={vw * 0.38} y={vh * 0.27} width={vw * 0.54} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.38} y={vh * 0.31} width={vw * 0.45} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.38} y={vh * 0.39} width={vw * 0.24} height={2.5} rx="1.25" fill={c.accent} />
          <rect x={vw * 0.38} y={vh * 0.45} width={vw * 0.54} height={1.5} rx="0.75" fill="#CBD5E1" />
        </>
      ) : (
        <>
          <rect width={vw} height={vh * 0.25} fill={c.header} />
          {hasPhoto ? (
            /* Photo on right side of header for non-sidebar photo templates */
            <>
              <circle cx={vw * 0.82} cy={vh * 0.125} r={vw * 0.1} fill="white" opacity="0.9" />
              <circle cx={vw * 0.82} cy={vh * 0.11} r={vw * 0.04} fill={c.header} opacity="0.4" />
              <ellipse cx={vw * 0.82} cy={vh * 0.155} rx={vw * 0.07} ry={vw * 0.04} fill={c.header} opacity="0.25" />
              <rect x={vw * 0.06} y={vh * 0.065} width={vw * 0.62} height={4} rx="2" fill="white" opacity="0.9" />
              <rect x={vw * 0.06} y={vh * 0.115} width={vw * 0.45} height={3} rx="1.5" fill="white" opacity="0.6" />
            </>
          ) : (
            <>
              <rect x={vw * 0.06} y={vh * 0.065} width={vw * 0.42} height={4} rx="2" fill="white" opacity="0.9" />
              <rect x={vw * 0.06} y={vh * 0.115} width={vw * 0.3}  height={3} rx="1.5" fill="white" opacity="0.6" />
            </>
          )}
          <rect x={vw * 0.06} y={vh * 0.3}   width={vw * 0.26} height={2.5} rx="1.25" fill={c.accent} />
          <rect x={vw * 0.06} y={vh * 0.37}  width={vw * 0.88} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.06} y={vh * 0.41}  width={vw * 0.75} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.06} y={vh * 0.52}  width={vw * 0.26} height={2.5} rx="1.25" fill={c.accent} />
          <rect x={vw * 0.06} y={vh * 0.58}  width={vw * 0.88} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.06} y={vh * 0.62}  width={vw * 0.65} height={1.5} rx="0.75" fill="#CBD5E1" />
          <rect x={vw * 0.06} y={vh * 0.73}  width={vw * 0.26} height={2.5} rx="1.25" fill={c.accent} />
          <rect x={vw * 0.06} y={vh * 0.79}  width={vw * 0.35} height={5}   rx="2.5"  fill={c.accent} opacity="0.15" />
        </>
      )}
    </svg>
  )
}

// ── Live Preview ──────────────────────────────────────────────────────────────

function LivePreview({ contact, templateId }: { contact: Partial<ContactInfo>; templateId: string }) {
  const cfg: Record<string, { accent: string; header: string }> = {
    modern: { accent: "#3B82F6", header: "#1E3A5F" },
    classic: { accent: "#374151", header: "#111827" },
    executive: { accent: "#D97706", header: "#0F172A" },
    minimal: { accent: "#94A3B8", header: "#334155" },
  }
  const c = cfg[templateId] ?? cfg.modern
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Your Name"
  const profession = contact.profession || "Your Profession"
  const location = [contact.city, contact.country].filter(Boolean).join(", ")
  return (
    <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      <div style={{ backgroundColor: c.header }} className="p-4">
        <p className="text-white font-bold text-sm truncate">{name}</p>
        <p style={{ color: c.accent }} className="text-xs mt-0.5 truncate font-medium opacity-90">{profession}</p>
        {location && <p className="text-white/60 text-xs mt-1 truncate">{location}</p>}
        {contact.email && <p className="text-white/60 text-xs truncate">{contact.email}</p>}
      </div>
      <div className="p-3 space-y-2">
        {["Summary", "Experience", "Skills"].map((sec) => (
          <div key={sec}>
            <div style={{ color: c.accent }} className="text-[10px] font-bold uppercase tracking-wide mb-1">{sec}</div>
            <div className="space-y-0.5">
              <div className="h-1.5 rounded bg-slate-100 w-full" />
              <div className="h-1.5 rounded bg-slate-100 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Confidence Badge ──────────────────────────────────────────────────────────

function ConfBadge({ score }: { score: number }) {
  if (score >= 75) return <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-semibold">High</Badge>
  if (score >= 40) return <Badge className="bg-amber-100 text-amber-700 text-[10px] font-semibold">Medium</Badge>
  return <Badge className="bg-red-100 text-red-700 text-[10px] font-semibold">Low</Badge>
}

// ── ATS Ring (grade + total score) ────────────────────────────────────────────

function AtsRing({ total, grade }: { total: number; grade: string }) {
  const r = 36; const circ = 2 * Math.PI * r
  const color = total >= 70 ? "#10B981" : total >= 50 ? "#F59E0B" : "#EF4444"
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${(total / 100) * circ} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 50 50)" />
      <text x="50" y="44" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0F172A">{grade}</text>
      <text x="50" y="58" textAnchor="middle" fontSize="10" fill="#64748B">{total}/100</text>
      <text x="50" y="70" textAnchor="middle" fontSize="8" fill="#94A3B8">ATS Score</text>
    </svg>
  )
}

// ── ATS Breakdown Panel ───────────────────────────────────────────────────────

function AtsBreakdownPanel({ ats }: { ats: ATSBreakdown }) {
  const sectionOrder = [
    "contact", "summary", "experience", "achievements",
    "skills", "education", "keywords", "formatting",
  ] as const

  const safetyColors = {
    high:   "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    low:    "bg-red-100 text-red-700",
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
        <Zap className="h-4 w-4 text-blue-600" />ATS Analysis
      </h3>

      {/* Ring + grade */}
      <div className="flex flex-col items-center gap-2">
        <AtsRing total={ats.total} grade={ats.grade} />
        <div className="flex items-center gap-2">
          <Badge className={cn("text-[10px] font-semibold", safetyColors[ats.safetyLevel])}>
            {ats.safetyLevel === "high" ? "High Safety" : ats.safetyLevel === "medium" ? "Medium Safety" : "Low Safety"}
          </Badge>
          {ats.jobMatchMode && (
            <Badge className="bg-blue-100 text-blue-700 text-[10px] font-semibold">Job Match</Badge>
          )}
        </div>
      </div>

      {/* Confidence note */}
      {ats.confidenceNote && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800">{ats.confidenceNote}</p>
        </div>
      )}

      {/* Section breakdown */}
      <div className="space-y-2">
        {sectionOrder.map((key) => {
          const sec = ats.sections[key]
          if (!sec) return null
          const barColor = sec.pct >= 70 ? "bg-emerald-500" : sec.pct >= 40 ? "bg-amber-500" : "bg-red-500"
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] text-slate-600 font-medium">{sec.label}</span>
                <span className="text-[11px] text-slate-500 font-semibold">{sec.score}/{sec.maxScore}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${sec.pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Missing */}
      {ats.missing.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />Missing
          </p>
          <ul className="space-y-1">
            {ats.missing.map((m) => (
              <li key={m} className="text-xs text-slate-600 flex gap-1.5"><span className="text-red-400">•</span>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── AI Coach Tab ──────────────────────────────────────────────────────────────

function AiCoachTab({
  suggestions: initialSuggestions,
  onApplySummary,
  onApplyContact,
}: {
  suggestions: AISuggestion[]
  onApplySummary: (text: string) => void
  onApplyContact: (field: keyof ParsedContact, value: string) => void
}) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>(initialSuggestions)
  const { toast } = useToast()

  const dismiss = (id: string) => setSuggestions((prev) => prev.filter((s) => s.id !== id))

  const handleApply = (s: AISuggestion) => {
    if (!s.exampleText) {
      toast("Open the builder to apply this change", "info")
      return
    }
    if (s.section === "summary") {
      onApplySummary(s.exampleText)
      toast("Summary updated — check the Summary tab", "success")
      dismiss(s.id)
      return
    }
    const contactFieldMap: Partial<Record<string, keyof ParsedContact>> = {
      "add-phone":    "phone",
      "add-email":    "email",
      "add-linkedin": "linkedin",
      "add-github":   "github",
      "add-location": "location",
      "fix-linkedin": "linkedin",
    }
    const field = contactFieldMap[s.id]
    if (field) {
      onApplyContact(field, s.exampleText)
      toast(`${s.title} applied`, "success")
      dismiss(s.id)
      return
    }
    toast("Open the builder to apply this change", "info")
  }

  const priorityColors: Record<string, string> = {
    high:   "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low:    "bg-slate-100 text-slate-600",
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
        <p className="text-sm font-semibold text-slate-900">All suggestions addressed!</p>
        <p className="text-xs text-slate-500 mt-1">Your resume looks great.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <div key={s.id} className="border border-slate-100 rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-[10px] font-bold capitalize", priorityColors[s.priority])}>
                {s.priority}
              </Badge>
              <Badge className="bg-slate-100 text-slate-500 text-[10px]">{s.section}</Badge>
            </div>
            <button
              onClick={() => dismiss(s.id)}
              className="text-slate-300 hover:text-slate-500 shrink-0"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="font-semibold text-sm text-slate-900">{s.title}</p>
          <p className="text-xs text-slate-600">{s.reason}</p>
          <p className="text-xs text-slate-700 font-medium">{s.fix}</p>
          {s.exampleText && (
            <div className="relative mt-1">
              <pre className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-3 whitespace-pre-wrap font-mono text-slate-700 leading-relaxed pr-8">
                {s.exampleText}
              </pre>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(s.exampleText ?? "")
                  toast("Copied to clipboard", "success")
                }}
                className="absolute top-2 right-2 p-1 rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300"
                title="Copy example"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => handleApply(s)}
              className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              Apply suggestion
            </Button>
            <button
              onClick={() => dismiss(s.id)}
              className="h-7 px-3 text-xs rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Template Badge helpers ────────────────────────────────────────────────────

function TemplateBadges({ templateId }: { templateId: string }) {
  const safety = TEMPLATE_ATS_SAFETY[templateId]
  const country = TEMPLATE_COUNTRY[templateId]
  const hasPhoto = PHOTO_TEMPLATES.has(templateId)

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {safety === "safe" && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">ATS Safe</span>
      )}
      {safety === "friendly" && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">ATS Friendly</span>
      )}
      {safety === "not-safe" && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Not ATS Safe</span>
      )}
      {country && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{country}</span>
      )}
      {hasPhoto && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Photo</span>
      )}
    </div>
  )
}

// ── Progress steps ────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { id: "experience", label: "Experience", icon: <Briefcase className="h-4 w-4" /> },
  { id: "template",   label: "Template",   icon: <FileText   className="h-4 w-4" /> },
  { id: "upload",     label: "Upload",     icon: <Upload     className="h-4 w-4" /> },
  { id: "contact",    label: "Contact",    icon: <User       className="h-4 w-4" /> },
]

// ── Upgrade Modal ─────────────────────────────────────────────────────────────

function UpgradeModal({ plan, onClose }: { plan: "PRO" | "GLOBAL"; onClose: () => void }) {
  const PLAN_FEATURES = {
    PRO: {
      name: "Pro",
      price: "$15/mo",
      color: "text-indigo-600",
      bg: "bg-indigo-600",
      border: "border-indigo-200",
      features: [
        "Unlimited resumes",
        "8 Pro templates (Executive, Creative, Consultant, Tech…)",
        "AI resume coach + rewrites",
        "No watermark on exports",
        "Priority PDF export",
      ],
    },
    GLOBAL: {
      name: "Global",
      price: "$29/mo",
      color: "text-amber-600",
      bg: "bg-amber-500",
      border: "border-amber-200",
      features: [
        "Everything in Pro",
        "All 17+ templates including region-specific",
        "All languages (German, French, Japanese…)",
        "German Lebenslauf, French CV, UAE format",
        "EU Blue Card & visa-ready formats",
      ],
    },
  }

  const pro = PLAN_FEATURES.PRO
  const global = PLAN_FEATURES.GLOBAL

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Unlock Premium Templates</h2>
            <p className="text-sm text-slate-500 mt-0.5">Choose a plan to access all templates</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {([pro, global] as typeof pro[]).map((p) => {
            const isHighlighted = p.name === (plan === "GLOBAL" ? "Global" : "Pro")
            return (
              <div key={p.name} className={cn("rounded-xl border-2 p-4 space-y-3 transition-all", isHighlighted ? `${p.border} bg-slate-50` : "border-slate-200")}>
                <div>
                  <div className={cn("text-xs font-bold uppercase tracking-wider mb-1", p.color)}>{p.name}</div>
                  <div className="text-2xl font-bold text-slate-900">{p.price}</div>
                </div>
                <ul className="space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn("w-full h-8 text-xs font-bold", isHighlighted ? `${p.bg} hover:opacity-90 text-white` : "bg-slate-100 text-slate-700 hover:bg-slate-200")}
                  onClick={() => { window.location.href = "/dashboard/settings#billing" }}
                >
                  {isHighlighted ? `Upgrade to ${p.name}` : `Get ${p.name}`}
                </Button>
              </div>
            )
          })}
        </div>
        <div className="px-6 pb-5 text-center text-xs text-slate-400">
          You can still preview any template — upgrade to use it when creating.
        </div>
      </div>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function CreateWizard({ userPlan = "FREE" }: { userPlan?: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<WizardStep>("experience")
  const [experience, setExperience] = useState<ExperienceLevel | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState("modern")
  const [filters, setFilters] = useState<TemplateFilter>({ activeTag: "all", language: "English" })
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradePlan, setUpgradePlan] = useState<"PRO" | "GLOBAL">("PRO")

  // Upload state
  const [uploadMode, setUploadMode] = useState<UploadMode>("file")
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [pasteText, setPasteText] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [showJdInput, setShowJdInput] = useState(false)
  const [parseProgress, setParseProgress] = useState<ParseProgress>(PARSE_STAGES[0])
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null)
  const [parseError, setParseError] = useState<{ message: string; errorCode?: string; details?: string } | null>(null)
  const [reviewTab, setReviewTab] = useState<ReviewTab>("contact")
  const [isCreating, setIsCreating] = useState(false)

  // Editable parsed fields
  const [editedContact, setEditedContact] = useState<ParsedContact>({})
  const [editedSummary, setEditedSummary] = useState("")
  const [editedEducation, setEditedEducation] = useState<ParsedEducation[]>([])

  // Contact form (contact step)
  const [contact, setContact] = useState<ContactInfo>({
    firstName: "", lastName: "", profession: "",
    city: "", country: "", phone: "", email: "", linkedin: "", website: "",
  })

  // ── Derived ───────────────────────────────────────────────────────────────

  const progressIdx = WIZARD_STEPS.findIndex((s) =>
    s.id === step || (step === "parsing" && s.id === "upload") || (step === "review" && s.id === "upload")
  )

  const canUseTemplate = (plan: string) => {
    if (userPlan === "ADMIN" || userPlan === "GLOBAL") return true
    if (plan === "FREE") return true
    if (plan === "PRO" && (userPlan === "PRO" || userPlan === "BASIC")) return true
    return false
  }

  const filteredTemplates = TEMPLATES.filter((t) => {
    if (filters.activeTag !== "all" && !t.tags.includes(filters.activeTag)) return false
    return true
  })

  // ── Upload handlers ───────────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setUploadedFile(file)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setUploadedFile(file)
  }

  // ── Parse ─────────────────────────────────────────────────────────────────

  const runParse = async (source: { file: File } | { text: string }) => {
    setStep("parsing")
    setParseError(null)

    let stageIdx = 0
    const advance = () => {
      if (stageIdx < PARSE_STAGES.length - 2) {
        stageIdx++
        setParseProgress(PARSE_STAGES[stageIdx])
      }
    }
    setParseProgress(PARSE_STAGES[0])
    const ticker = setInterval(advance, 700)

    try {
      let res: Response
      if ("file" in source) {
        const form = new FormData()
        form.append("file", source.file)
        if (jobDescription.trim()) form.append("jobDescription", jobDescription.trim())
        res = await fetch("/api/resume/import", { method: "POST", body: form })
      } else {
        res = await fetch("/api/resume/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: source.text, jobDescription: jobDescription.trim() || undefined }),
        })
      }

      clearInterval(ticker)
      const json = await res.json()

      if (!res.ok || !json.success) {
        setParseError({
          message: json.message || "Parsing failed. Please try a different format.",
          errorCode: json.errorCode,
          details: json.details,
        })
        setParseProgress({ stage: "error", pct: 0, label: "Parsing failed" })
        return
      }

      const parsed: ParsedResume = json.parsedData

      if (!parsed.rawText.trim() || parsed.warning === "scanned") {
        setParseError({
          message: "Could not extract text from this file. It may be a scanned or image-based PDF.",
          errorCode: "SCANNED_PDF",
        })
        setParseProgress({ stage: "error", pct: 0, label: "No text found" })
        return
      }

      setParsedResume(parsed)
      setEditedContact(parsed.contact)
      setEditedSummary(parsed.summary)
      setEditedEducation(parsed.education)

      // Auto-fill contact form
      const nameParts = (parsed.contact.fullName ?? "").trim().split(/\s+/)
      setContact({
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" "),
        profession: parsed.contact.jobTitle ?? "",
        city: (parsed.contact.location ?? "").split(",")[0]?.trim() ?? "",
        country: (parsed.contact.location ?? "").split(",").slice(1).join(",").trim(),
        phone: parsed.contact.phone ?? "",
        email: parsed.contact.email ?? "",
        linkedin: parsed.contact.linkedin ?? "",
        website: parsed.contact.website ?? "",
      })

      setParseProgress(PARSE_STAGES[PARSE_STAGES.length - 1])
      await new Promise((r) => setTimeout(r, 700))
      setStep("review")
    } catch (err) {
      clearInterval(ticker)
      const msg = err instanceof Error ? err.message : "Network error. Please try again."
      setParseError({ message: msg, errorCode: "NETWORK_ERROR" })
      setParseProgress({ stage: "error", pct: 0, label: "Network error" })
    }
  }

  // ── Sync edited contact → contact form when transitioning to contact step ──

  const transitionToContact = () => {
    if (parsedResume) {
      const nameParts = (editedContact.fullName ?? "").trim().split(/\s+/)
      setContact({
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" "),
        profession: editedContact.jobTitle ?? "",
        city: (editedContact.location ?? "").split(",")[0]?.trim() ?? "",
        country: (editedContact.location ?? "").split(",").slice(1).join(",").trim(),
        phone: editedContact.phone ?? "",
        email: editedContact.email ?? "",
        linkedin: editedContact.linkedin ?? "",
        website: editedContact.website ?? "",
      })
    }
    setStep("contact")
  }

  // ── Create resume + go to builder ─────────────────────────────────────────

  const handleFinish = async () => {
    // ── Pre-flight validation ─────────────────────────────────────────────────
    if (!contact.email?.trim()) {
      toast("Please add your email address before creating the resume.", "error")
      return
    }
    if (!contact.firstName?.trim() && !contact.lastName?.trim()) {
      toast("Please add your name before creating the resume.", "error")
      return
    }
    if (!selectedTemplate) {
      toast("Please select a template before continuing.", "error")
      return
    }

    setIsCreating(true)
    try {
      const langCode =
        filters.language === "German"     ? "de"
        : filters.language === "French"   ? "fr"
        : filters.language === "Japanese" ? "ja"
        : filters.language === "Spanish"  ? "es"
        : filters.language === "Portuguese" ? "pt"
        : "en"

      const contactContent = {
        firstName:  contact.firstName  || "",
        lastName:   contact.lastName   || "",
        email:      contact.email      || "",
        phone:      contact.phone      || "",
        address:    "",
        city:       contact.city       || "",
        country:    contact.country    || "",
        linkedin:   contact.linkedin   || "",
        website:    contact.website    || "",
      }

      const experienceItems = (parsedResume?.experience ?? []).map((e, i) => ({
        id: `exp-${i}`,
        company:     e.company   || "",
        position:    e.title     || "",
        startDate:   e.startDate || "",
        endDate:     e.endDate   || "",
        current:     e.current   ?? false,
        description: e.bullets?.map((b) => `• ${b}`).join("\n") || "",
      }))

      const educationToSave = editedEducation.length > 0 ? editedEducation : (parsedResume?.education ?? [])
      const educationItems = educationToSave.map((e, i) => ({
        id:          `edu-${i}`,
        institution: e.institution || "",
        degree:      e.degree      || "",
        field:       e.field       || "",
        startDate:   e.startDate   || "",
        endDate:     e.endDate     || "",
      }))

      const skillItems = (parsedResume?.skills.all ?? []).map((name, i) => ({
        id: `skill-${i}`, name, level: "Intermediate",
      }))

      // Normalize language/cert/project items to ensure no stray parser types leak in
      const langItems = (parsedResume?.languages ?? []).map((l, i) =>
        typeof l === "string"
          ? { id: `lang-${i}`, language: l, proficiency: "Professional" }
          : { id: (l as { id?: string }).id || `lang-${i}`, ...(l as object) }
      )
      const certItems = (parsedResume?.certifications ?? []).map((c, i) =>
        typeof c === "string"
          ? { id: `cert-${i}`, name: c, issuer: "", date: "", url: "" }
          : { id: (c as { id?: string }).id || `cert-${i}`, ...(c as object) }
      )
      const projItems = (parsedResume?.projects ?? []).map((p, i) =>
        typeof p === "string"
          ? { id: `proj-${i}`, name: p, description: "", url: "", startDate: "", endDate: "" }
          : { id: (p as { id?: string }).id || `proj-${i}`, ...(p as object) }
      )

      const sections = [
        { type: "CONTACT",        content: contactContent,                                      order: 0 },
        { type: "SUMMARY",        content: { text: editedSummary || "" },                        order: 1 },
        { type: "EXPERIENCE",     content: { items: experienceItems },                            order: 2 },
        { type: "EDUCATION",      content: { items: educationItems },                             order: 3 },
        { type: "SKILLS",         content: { items: skillItems },                                 order: 4 },
        { type: "LANGUAGES",      content: { items: langItems },                                  order: 5 },
        { type: "CERTIFICATIONS", content: { items: certItems },                                  order: 6 },
        { type: "PROJECTS",       content: { items: projItems },                                  order: 7 },
        { type: "PORTFOLIO",      content: { tagline: "", links: [], showcases: [] },             order: 8 },
      ]

      const payload = {
        title: contact.firstName
          ? `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ""}'s Resume`
          : "My Resume",
        languageCode:  langCode,
        templateId:    selectedTemplate,
        targetCountry: "US",
        sections,
      }

      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      // Always try to read the JSON body so we can show the real error
      let data: { success?: boolean; message?: string; errorCode?: string; resume?: { id: string }; id?: string } = {}
      try { data = await res.json() } catch { /* non-JSON body */ }

      if (!res.ok) {
        const serverMsg = data.message || `Server error ${res.status}`
        if (res.status === 401) {
          toast("Please sign in to create your resume.", "error")
          router.push("/login")
          return
        }
        if (res.status === 403 && data.errorCode === "RESUME_LIMIT_REACHED") {
          toast(serverMsg, "error")
          return
        }
        if (res.status === 429) {
          toast("Too many requests — please wait a moment and try again.", "error")
          return
        }
        throw new Error(serverMsg)
      }

      const resumeId = data.resume?.id ?? (data as { id?: string }).id
      if (!resumeId) throw new Error("Server returned success but no resume ID.")

      toast("Resume created! Opening builder…", "success")
      router.push(`/dashboard/builder/${resumeId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create resume. Please try again."
      toast(msg, "error")
    } finally {
      setIsCreating(false)
    }
  }

  // ── Nav ───────────────────────────────────────────────────────────────────

  const canNext = (): boolean => {
    if (step === "experience") return experience !== null
    if (step === "template") return true
    if (step === "upload") {
      if (uploadMode === "file") return uploadedFile !== null
      return pasteText.trim().length > 50
    }
    if (step === "contact") {
      return !!(contact.email?.trim() && (contact.firstName?.trim() || contact.lastName?.trim()))
    }
    return true
  }

  const goNext = () => {
    if (step === "experience") setStep("template")
    else if (step === "template") setStep("upload")
    else if (step === "upload") {
      if (uploadMode === "file" && uploadedFile) runParse({ file: uploadedFile })
      else if (uploadMode === "paste" && pasteText.trim()) runParse({ text: pasteText })
    }
    else if (step === "review") transitionToContact()
    else if (step === "contact") handleFinish()
  }

  const goBack = () => {
    if (step === "template") setStep("experience")
    else if (step === "upload") setStep("template")
    else if (step === "parsing") { setStep("upload"); setParseError(null) }
    else if (step === "review") setStep("upload")
    else if (step === "contact") setStep(parsedResume ? "review" : "upload")
  }

  const addQuickEducation = (d: { degree: string; field: string }) => {
    const newEdu: ParsedEducation = { institution: "", degree: d.degree, field: d.field, startDate: "", endDate: "", location: "" }
    setEditedEducation((prev) => [...prev, newEdu])
    toast("Education added — fill in institution and dates in the builder", "success")
  }

  const resetToUpload = () => {
    setParseError(null)
    setUploadedFile(null)
    setPasteText("")
    setStep("upload")
  }

  const skipToManual = () => {
    setParsedResume(null)
    setParseError(null)
    setEditedContact({})
    setEditedSummary("")
    setContact({ firstName: "", lastName: "", profession: "", city: "", country: "", phone: "", email: "", linkedin: "", website: "" })
    setStep("contact")
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 flex flex-col">
      {/* Top progress bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {WIZARD_STEPS.map((s, i) => {
            const isActive = s.id === step ||
              (step === "parsing" && s.id === "upload") ||
              (step === "review" && s.id === "upload")
            const isDone = i < progressIdx
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                  isDone ? "bg-emerald-100 text-emerald-700"
                    : isActive ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500"
                )}>
                  {isDone ? <Check className="h-3.5 w-3.5" /> : s.icon}
                  {s.label}
                </div>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className={cn("h-px w-8 transition-colors", isDone ? "bg-emerald-300" : "bg-slate-200")} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl">

          {/* ── Step 1: Experience ── */}
          {step === "experience" && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">How long have you been working?</h1>
                <p className="text-slate-500 mt-2">We&apos;ll recommend the best resume format for your level.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button key={opt.id} onClick={() => setExperience(opt.id)}
                    className={cn(
                      "group p-5 rounded-2xl border-2 text-left transition-all",
                      experience === opt.id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                    )}>
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

          {/* ── Step 2: Template ── */}
          {step === "template" && (
            <div>
              {showUpgradeModal && (
                <UpgradeModal plan={upgradePlan} onClose={() => setShowUpgradeModal(false)} />
              )}
              <div className="text-center mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Choose your template</h1>
                <p className="text-slate-500 mt-2">You can change this later in the builder. Free plan: 4 templates included.</p>
              </div>
              {/* Filter chips */}
              <div className="mb-5 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { id: "all",        label: "All" },
                    { id: "free",       label: "Free" },
                    { id: "ats-safe",   label: "ATS Safe" },
                    { id: "no-photo",   label: "No Photo" },
                    { id: "with-photo", label: "With Photo" },
                    { id: "one-col",    label: "1 Column" },
                    { id: "two-col",    label: "2 Columns" },
                    { id: "executive",  label: "Executive" },
                    { id: "tech",       label: "Tech" },
                    { id: "europe",     label: "Europe" },
                    { id: "creative",   label: "Creative" },
                    { id: "academic",   label: "Academic" },
                    { id: "pro",        label: "Pro" },
                    { id: "global",     label: "Global" },
                  ] as { id: FilterTag; label: string }[]).map((chip) => (
                    <button key={chip.id}
                      onClick={() => setFilters((f) => ({ ...f, activeTag: chip.id }))}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                        filters.activeTag === chip.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                      )}>
                      {chip.label}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-1.5">
                    <Label className="text-xs text-slate-500 whitespace-nowrap">Language:</Label>
                    <select value={filters.language}
                      onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white h-7">
                      {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} shown</p>
              </div>

              {/* Upgrade notice */}
              {!canUseTemplate(TEMPLATES.find((t) => t.id === selectedTemplate)?.plan ?? "FREE") && (
                <div className="mb-4 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                  <Zap className="h-4 w-4 text-indigo-600 shrink-0" />
                  <p className="text-sm text-indigo-800 flex-1">
                    <span className="font-semibold">{TEMPLATES.find((t) => t.id === selectedTemplate)?.name}</span> requires the{" "}
                    <span className="font-semibold">{TEMPLATES.find((t) => t.id === selectedTemplate)?.plan}</span> plan.
                  </p>
                  <button
                    onClick={() => {
                      const plan = TEMPLATES.find((t) => t.id === selectedTemplate)?.plan
                      setUpgradePlan(plan === "GLOBAL" ? "GLOBAL" : "PRO")
                      setShowUpgradeModal(true)
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                  >
                    View Plans →
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTemplates.map((t) => {
                  const isRec = experience && t.recommended.includes(experience)
                  const isSelected = selectedTemplate === t.id
                  const isLocked = !canUseTemplate(t.plan)
                  return (
                    <button key={t.id}
                      onClick={() => {
                        setSelectedTemplate(t.id)
                        if (isLocked) {
                          setUpgradePlan(t.plan === "GLOBAL" ? "GLOBAL" : "PRO")
                          setShowUpgradeModal(true)
                        }
                      }}
                      className={cn(
                        "group relative rounded-xl border-2 overflow-hidden text-left transition-all",
                        isSelected ? "border-blue-500 shadow-lg" : "border-slate-200 hover:border-blue-300 hover:shadow-md"
                      )}>
                      {isRec && (
                        <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" />Rec
                        </div>
                      )}
                      {t.plan !== "FREE" && (
                        <div className={cn("absolute top-2 right-2 z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                          t.plan === "GLOBAL" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700")}>
                          {isLocked && <span className="text-[9px]">🔒</span>}
                          {t.plan}
                        </div>
                      )}
                      {isLocked && (
                        <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
                      )}
                      {isSelected && !isLocked && (
                        <div className="absolute bottom-2 right-2 z-10 h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className="h-36 bg-slate-50"><TemplateSVG templateId={t.id} /></div>
                      <div className="p-2.5 bg-white">
                        <p className={cn("text-xs font-semibold truncate", isSelected ? "text-blue-700" : "text-slate-800")}>{t.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t.style} · {t.columns} col</p>
                        <TemplateBadges templateId={t.id} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Upload ── */}
          {step === "upload" && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Do you have an existing resume?</h1>
                <p className="text-slate-500 mt-2">Import your resume and we&apos;ll fill in the details automatically.</p>
              </div>

              {/* Mode tabs */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setUploadMode("file")}
                    className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      uploadMode === "file" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}>
                    <Upload className="h-4 w-4" />Upload File
                  </button>
                  <button
                    onClick={() => setUploadMode("paste")}
                    className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      uploadMode === "paste" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}>
                    <ClipboardPaste className="h-4 w-4" />Paste Text
                  </button>
                  <button
                    onClick={skipToManual}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-700 transition-all">
                    <AlignLeft className="h-4 w-4" />Start Fresh
                  </button>
                </div>
              </div>

              {uploadMode === "file" && (
                <div className="max-w-xl mx-auto space-y-4">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                      "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer",
                      isDragging ? "border-blue-500 bg-blue-50"
                        : uploadedFile ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                    )}
                    onClick={() => !uploadedFile && fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.rtf,.txt,.html" onChange={handleFileInput} className="hidden" />
                    {uploadedFile ? (
                      <div>
                        <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                          <Check className="h-7 w-7 text-emerald-600" />
                        </div>
                        <p className="font-semibold text-emerald-700 text-sm">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setUploadedFile(null) }}
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
                        <p className="font-semibold text-slate-700 mb-1">Drag & drop or click to browse</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, RTF, TXT, HTML · max 10 MB</p>
                      </div>
                    )}
                  </div>

                  {/* Cloud */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400">or import from</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "Google Drive", icon: <HardDrive className="h-4 w-4" />, color: "text-blue-600" },
                      { name: "Dropbox",      icon: <HardDrive className="h-4 w-4" />, color: "text-indigo-600" },
                    ].map((opt) => (
                      <button key={opt.name}
                        onClick={() => toast("Coming soon — cloud storage connect", "info")}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm text-sm font-medium text-slate-700">
                        <span className={opt.color}>{opt.icon}</span>{opt.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {uploadMode === "paste" && (
                <div className="max-w-xl mx-auto">
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Paste your resume text below</Label>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste the full text of your resume here…&#10;&#10;We'll detect sections automatically."
                    className="w-full h-60 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">{pasteText.length} characters · minimum 50 to analyze</p>
                </div>
              )}

              {/* Job description collapsible */}
              <div className="max-w-xl mx-auto mt-4">
                <button
                  onClick={() => setShowJdInput((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:border-slate-300 transition-all"
                >
                  <span className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    Paste job description <span className="text-slate-400 font-normal">(optional)</span>
                  </span>
                  {showJdInput ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                {showJdInput && (
                  <div className="mt-2">
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here for a tailored ATS keyword match score…"
                      className="w-full h-36 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">Adding a job description enables a precise keyword match score in your ATS report.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step: Parsing progress ── */}
          {step === "parsing" && (
            <div className="max-w-md mx-auto text-center">
              {parseProgress.stage === "error" ? (
                <>
                  <div className="h-20 w-20 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-5">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 mb-1">
                    {parseError?.errorCode === "SCANNED_PDF" ? "Image-based PDF" : "Could not parse file"}
                  </h1>
                  <p className="text-slate-500 text-sm mb-6">{parseError?.message}</p>

                  {/* Recovery options */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 text-left space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">What would you like to do?</p>
                    <button
                      onClick={resetToUpload}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
                      <RotateCcw className="h-5 w-5 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Try a different file</p>
                        <p className="text-xs text-slate-500">Upload a text-based PDF or DOCX</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setUploadMode("paste"); resetToUpload() }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
                      <ClipboardPaste className="h-5 w-5 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Paste resume text instead</p>
                        <p className="text-xs text-slate-500">Copy-paste from your existing resume</p>
                      </div>
                    </button>
                    <button
                      onClick={skipToManual}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
                      <AlignLeft className="h-5 w-5 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Fill in manually</p>
                        <p className="text-xs text-slate-500">Enter your details in the form — template is saved</p>
                      </div>
                    </button>
                  </div>

                  {parseError?.errorCode === "SCANNED_PDF" && (
                    <p className="text-xs text-slate-400 mt-4">
                      Scanned PDFs contain images of text, not selectable text. Export your resume from Word or Google Docs as a standard PDF.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className={cn(
                    "h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-5",
                    parseProgress.stage === "ready" ? "bg-emerald-100" : "bg-blue-50"
                  )}>
                    {parseProgress.stage === "ready"
                      ? <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                      : <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                    }
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 mb-1">
                    {parseProgress.stage === "ready" ? "Analysis complete!" : "Analyzing your resume…"}
                  </h1>
                  <p className="text-slate-500 text-sm mb-6">{parseProgress.label}</p>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${parseProgress.pct}%` }} />
                  </div>

                  <div className="space-y-2 text-left">
                    {PARSE_STAGES.slice(0, -1).map((s, i) => {
                      const curIdx = PARSE_STAGES.findIndex((p) => p.stage === parseProgress.stage)
                      const done = i < curIdx
                      const active = i === curIdx
                      return (
                        <div key={s.stage} className="flex items-center gap-2 text-sm">
                          {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            : active ? <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                            : <div className="h-4 w-4 rounded-full border-2 border-slate-200 shrink-0" />}
                          <span className={cn(done ? "text-emerald-600" : active ? "text-blue-700 font-medium" : "text-slate-400")}>
                            {s.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step: Review ── */}
          {step === "review" && parsedResume && (
            <div>
              <div className="text-center mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Review extracted data</h1>
                <p className="text-slate-500 mt-2">Edit any field inline — changes carry through to your resume.</p>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main tabs */}
                <div className="xl:col-span-2 space-y-4">
                  {/* Confidence bar */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900 text-sm">Import Confidence</p>
                        <ConfBadge score={parsedResume.confidence.overall} />
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${parsedResume.confidence.overall}%` }} />
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900 shrink-0">{parsedResume.confidence.overall}%</span>
                  </div>

                  {/* Tabs */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="flex border-b border-slate-100 overflow-x-auto">
                      {[
                        { id: "contact"    as ReviewTab, label: "Contact",    icon: <User className="h-3.5 w-3.5" />,         conf: parsedResume.confidence.contact    },
                        { id: "summary"    as ReviewTab, label: "Summary",    icon: <AlignLeft className="h-3.5 w-3.5" />,    conf: null                               },
                        { id: "experience" as ReviewTab, label: "Experience", icon: <Briefcase className="h-3.5 w-3.5" />,    conf: parsedResume.confidence.experience },
                        { id: "education"  as ReviewTab, label: "Education",  icon: <GraduationCap className="h-3.5 w-3.5" />,conf: parsedResume.confidence.education  },
                        { id: "skills"     as ReviewTab, label: "Skills",     icon: <Code className="h-3.5 w-3.5" />,         conf: parsedResume.confidence.skills     },
                        { id: "aicoach"    as ReviewTab, label: "AI Coach",   icon: <Sparkles className="h-3.5 w-3.5" />,     conf: null                               },
                      ].map((tab) => (
                        <button key={tab.id} onClick={() => setReviewTab(tab.id)}
                          className={cn(
                            "flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap",
                            reviewTab === tab.id
                              ? "border-blue-600 text-blue-700 bg-blue-50/50"
                              : "border-transparent text-slate-500 hover:text-slate-700"
                          )}>
                          {tab.icon}{tab.label}
                          {tab.conf !== null && (
                            <span className={cn("ml-1 text-[10px] font-bold px-1 py-0.5 rounded",
                              tab.conf >= 70 ? "bg-emerald-100 text-emerald-700"
                                : tab.conf >= 40 ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700")}>
                              {tab.conf}%
                            </span>
                          )}
                          {tab.id === "aicoach" && parsedResume.ats.suggestions.length > 0 && (
                            <span className="ml-1 text-[10px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-700">
                              {parsedResume.ats.suggestions.length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="p-5">

                      {/* Contact — editable */}
                      {reviewTab === "contact" && (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                            <Info className="h-3 w-3" />Edit fields directly — changes will auto-fill the contact form.
                          </p>
                          {(
                            [
                              { label: "Full Name",  key: "fullName"  as keyof ParsedContact, conf: parsedResume.confidence.contact },
                              { label: "Job Title",  key: "jobTitle"  as keyof ParsedContact, conf: parsedResume.confidence.contact },
                              { label: "Email",      key: "email"     as keyof ParsedContact, conf: parsedResume.confidence.contact },
                              { label: "Phone",      key: "phone"     as keyof ParsedContact, conf: parsedResume.confidence.contact },
                              { label: "Location",   key: "location"  as keyof ParsedContact, conf: parsedResume.confidence.contact },
                              { label: "LinkedIn",   key: "linkedin"  as keyof ParsedContact, conf: 0 },
                              { label: "GitHub",     key: "github"    as keyof ParsedContact, conf: 0 },
                              { label: "Website",    key: "website"   as keyof ParsedContact, conf: 0 },
                            ] as { label: string; key: keyof ParsedContact; conf: number }[]
                          ).map(({ label, key, conf }) => (
                            <div key={label} className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 w-24 shrink-0">
                                <span className="text-xs font-semibold text-slate-400">{label}</span>
                              </div>
                              <div className="flex-1 relative">
                                <Input
                                  value={(editedContact[key] as string | undefined) ?? ""}
                                  onChange={(e) => setEditedContact((prev) => ({ ...prev, [key]: e.target.value || undefined }))}
                                  placeholder={`Not detected`}
                                  className="h-8 text-xs border-slate-200 pr-16"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  {editedContact[key] ? (
                                    <ConfBadge score={conf} />
                                  ) : (
                                    <span className="text-[10px] text-slate-300 italic">empty</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Summary — editable */}
                      {reviewTab === "summary" && (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Info className="h-3 w-3" />Edit or write your professional summary here.
                          </p>
                          <textarea
                            value={editedSummary}
                            onChange={(e) => setEditedSummary(e.target.value)}
                            placeholder="Write a 2–3 sentence professional summary…&#10;&#10;Example: Results-driven Software Engineer with 5+ years building scalable web applications. Expert in React, Node.js, and AWS."
                            className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-slate-400">{editedSummary.trim().split(/\s+/).filter(Boolean).length} words · aim for 30–80</p>
                        </div>
                      )}

                      {/* Experience */}
                      {reviewTab === "experience" && (
                        <div className="space-y-4">
                          {parsedResume.experience.length === 0 ? (
                            <div className="text-center py-8">
                              <Briefcase className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                              <p className="text-sm text-slate-500">No work experience detected</p>
                              <p className="text-xs text-slate-400 mt-1">Add it manually in the builder</p>
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
                              {exp.bullets.slice(0, 3).map((b, j) => (
                                <p key={j} className="text-xs text-slate-600 flex gap-1.5"><span className="text-slate-300 shrink-0">•</span>{b}</p>
                              ))}
                              {exp.bullets.length > 3 && <p className="text-xs text-slate-400 mt-1">+{exp.bullets.length - 3} more…</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Education */}
                      {reviewTab === "education" && (
                        <div className="space-y-4">
                          {editedEducation.length === 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                              <p className="text-sm font-semibold text-amber-900 mb-1 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />No education detected
                              </p>
                              <p className="text-xs text-amber-700 mb-3">What is your highest qualification?</p>
                              <div className="flex flex-wrap gap-2">
                                {QUICK_DEGREES.map((d) => (
                                  <button
                                    key={d.label}
                                    onClick={() => addQuickEducation(d)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
                                  >
                                    {d.label}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-amber-600 mt-3">
                                Select a degree to add it, then complete the details in the builder.
                              </p>
                            </div>
                          )}
                          {editedEducation.map((edu, i) => (
                            <div key={i} className="border border-slate-100 rounded-xl p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">{edu.institution || <span className="text-slate-400 italic">Institution TBD</span>}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{[edu.degree, edu.field].filter(Boolean).join(" in ") || "Unknown Degree"}</p>
                                  {(edu.startDate || edu.endDate) && (
                                    <p className="text-xs text-slate-400 mt-1">{edu.startDate} – {edu.endDate}</p>
                                  )}
                                  {edu.gpa && <p className="text-xs text-slate-500 mt-1">GPA: {edu.gpa}</p>}
                                </div>
                                <button
                                  onClick={() => setEditedEducation((prev) => prev.filter((_, idx) => idx !== i))}
                                  className="text-slate-300 hover:text-red-400 shrink-0"
                                  title="Remove"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Skills */}
                      {reviewTab === "skills" && (
                        <div className="space-y-4">
                          {parsedResume.skills.all.length === 0 ? (
                            <div className="text-center py-8">
                              <Code className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                              <p className="text-sm text-slate-500">No skills detected</p>
                            </div>
                          ) : (
                            <>
                              {parsedResume.skills.technical.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Technical</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {parsedResume.skills.technical.map((s) => <Badge key={s} className="bg-blue-100 text-blue-700 text-xs">{s}</Badge>)}
                                  </div>
                                </div>
                              )}
                              {parsedResume.skills.tools.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tools & Other</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {parsedResume.skills.tools.map((s) => <Badge key={s} className="bg-slate-100 text-slate-600 text-xs">{s}</Badge>)}
                                  </div>
                                </div>
                              )}
                              {parsedResume.skills.soft.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Soft Skills</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {parsedResume.skills.soft.map((s) => <Badge key={s} className="bg-purple-100 text-purple-700 text-xs">{s}</Badge>)}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* AI Coach */}
                      {reviewTab === "aicoach" && (
                        <AiCoachTab
                          suggestions={parsedResume.ats.suggestions}
                          onApplySummary={(text) => { setEditedSummary(text); setReviewTab("summary") }}
                          onApplyContact={(field, value) => {
                            setEditedContact((prev) => ({ ...prev, [field]: value }))
                            setReviewTab("contact")
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* ATS breakdown panel */}
                <div className="space-y-4">
                  <AtsBreakdownPanel ats={parsedResume.ats} />
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between"><span>File type</span><span className="font-semibold text-slate-700 uppercase">{parsedResume.fileType}</span></div>
                    <div className="flex justify-between"><span>Pages</span><span className="font-semibold text-slate-700">{parsedResume.pageCount}</span></div>
                    <div className="flex justify-between"><span>Text extracted</span><span className="font-semibold text-slate-700">{parsedResume.rawText.length.toLocaleString()} chars</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step: Contact ── */}
          {step === "contact" && (
            <div>
              <div className="text-center mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Confirm your contact info</h1>
                <p className="text-slate-500 mt-2">This appears at the top of your resume.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  {parsedResume && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-sm font-medium text-emerald-700">
                        Auto-filled · {parsedResume.confidence.contact}% contact confidence
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
                      <Label className="text-sm font-medium text-slate-700">LinkedIn</Label>
                      <Input value={contact.linkedin} onChange={(e) => setContact((c) => ({ ...c, linkedin: e.target.value }))} placeholder="linkedin.com/in/janesmith" className="h-10 border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Website / Portfolio</Label>
                      <Input value={contact.website} onChange={(e) => setContact((c) => ({ ...c, website: e.target.value }))} placeholder="janesmith.dev" className="h-10 border-slate-200" />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Live Preview</p>
                  <div className="h-72"><LivePreview contact={contact} templateId={selectedTemplate} /></div>
                  <p className="text-xs text-slate-400 mt-2">
                    Template: <span className="font-semibold text-slate-600 capitalize">{selectedTemplate}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Bottom nav ── */}
          {step !== "parsing" && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
              {step !== "experience" ? (
                <Button variant="outline" onClick={goBack} className="border-slate-200">
                  <ChevronLeft className="h-4 w-4 mr-1" />Back
                </Button>
              ) : <div />}

              {step === "upload" ? (
                <Button onClick={goNext} disabled={!canNext()} className="bg-blue-600 hover:bg-blue-700 min-w-[160px]">
                  {uploadMode === "file" ? (
                    <><Upload className="h-4 w-4 mr-2" />Import &amp; Analyze</>
                  ) : uploadMode === "paste" ? (
                    <><Sparkles className="h-4 w-4 mr-2" />Analyze Text</>
                  ) : (
                    <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              ) : (
                <Button onClick={goNext} disabled={!canNext() || isCreating} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                  {isCreating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
                  ) : step === "review" ? (
                    <>Looks Good <ChevronRight className="h-4 w-4 ml-1" /></>
                  ) : step === "contact" ? (
                    <>Open Builder <ChevronRight className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
