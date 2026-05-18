"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useResumeStore, type ResumeData } from "@/store/useResumeStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Save, Download, Printer, ArrowLeft, FileText, Briefcase,
  GraduationCap, Code, User, CheckSquare, Loader2,
  BookOpen, Globe, FolderOpen, Plus, Trash2, Sparkles, Target,
  Undo2, Redo2, ZoomIn, ZoomOut, MoreHorizontal, CheckCircle2,
  Palette, Mail, Camera, X, AlertCircle, ChevronRight,
  CropIcon, CheckCircle, Circle, Star,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { generateSummary, rewriteBullet, optimizeForATS, translateContent } from "@/actions/ai"
import { useToast, type ToastType } from "@/components/ui/toaster"

// ── Types ─────────────────────────────────────────────────────────────────────

type Section = "contact" | "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "languages" | "portfolio"
type Experience    = ResumeData["experience"][number]
type Education     = ResumeData["education"][number]
type Skill         = ResumeData["skills"][number]
type Project       = ResumeData["projects"][number]
type Certification = ResumeData["certifications"][number]
type Lang          = ResumeData["languages"][number]

type ATSSuggestion = {
  id: string
  priority: "high" | "medium" | "low"
  section: Section
  title: string
  reason: string
  fix: string
  applyLabel?: string
  apply?: () => void
}

const SECTION_LABELS: Record<Section, string> = {
  contact: "Contact", summary: "Summary", experience: "Work History",
  education: "Education", skills: "Skills", projects: "Projects",
  certifications: "Certifications", languages: "Languages", portfolio: "Portfolio",
}

// ── Multilingual headings ────────────────────────────────────────────────────

const HEADINGS: Record<string, Record<string, string>> = {
  en: { summary: "Professional Summary", experience: "Work Experience", education: "Education", skills: "Skills", projects: "Projects", certifications: "Certifications", languages: "Languages", portfolio: "Portfolio", about: "About" },
  de: { summary: "Profil", experience: "Berufserfahrung", education: "Ausbildung", skills: "Fähigkeiten", projects: "Projekte", certifications: "Zertifizierungen", languages: "Sprachen", portfolio: "Portfolio", about: "Über mich" },
  fr: { summary: "Profil", experience: "Expérience professionnelle", education: "Formation", skills: "Compétences", projects: "Projets", certifications: "Certifications", languages: "Langues", portfolio: "Portfolio", about: "Profil" },
  es: { summary: "Perfil profesional", experience: "Experiencia laboral", education: "Educación", skills: "Habilidades", projects: "Proyectos", certifications: "Certificaciones", languages: "Idiomas", portfolio: "Portfolio", about: "Perfil" },
  pt: { summary: "Perfil profissional", experience: "Experiência profissional", education: "Formação", skills: "Competências", projects: "Projetos", certifications: "Certificações", languages: "Idiomas", portfolio: "Portfolio", about: "Perfil" },
  ja: { summary: "プロフィール", experience: "職務経歴", education: "学歴", skills: "スキル", projects: "プロジェクト", certifications: "資格・認定", languages: "語学", portfolio: "ポートフォリオ", about: "自己PR" },
  zh: { summary: "个人简介", experience: "工作经历", education: "教育背景", skills: "专业技能", projects: "项目经验", certifications: "证书", languages: "语言能力", portfolio: "作品集", about: "关于我" },
}

function h(lang: string, key: keyof typeof HEADINGS.en): string {
  return (HEADINGS[lang] ?? HEADINGS.en)[key]
}

const PRESENT_LABEL: Record<string, string> = {
  en: "Present", de: "Heute", fr: "Aujourd'hui", es: "Actualidad",
  pt: "Atual", ja: "現在", zh: "至今",
}

const PHOTO_TEMPLATES  = new Set(["german", "french", "japanese", "creative"])
const SIDEBAR_TEMPLATES = new Set(["modern", "creative", "french", "global"])

// ── Date formatting ───────────────────────────────────────────────────────────

function fmt(dateStr: string, lang: string): string {
  if (!dateStr) return ""
  try {
    // Support "YYYY" (year-only) and "YYYY-MM"
    const normalized = dateStr.length === 4 ? `${dateStr}-01` : `${dateStr}-01`
    const d = new Date(normalized)
    if (isNaN(d.getTime())) return dateStr
    const locales: Record<string, string> = { ja: "ja-JP", de: "de-DE", fr: "fr-FR", es: "es-ES", pt: "pt-BR", zh: "zh-CN" }
    const locale = locales[lang] ?? "en-US"
    if (dateStr.length === 4) return dateStr // year-only → just show year
    return d.toLocaleDateString(locale, { year: "numeric", month: "short" })
  } catch { return dateStr }
}

// ─── Month/Year Picker ────────────────────────────────────────────────────────

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function MonthYearPicker({
  value, onChange, isPresent = false, onPresentChange, lang = "en", label,
}: {
  value: string
  onChange: (v: string) => void
  isPresent?: boolean
  onPresentChange?: (v: boolean) => void
  lang?: string
  label?: string
}) {
  const parts  = value?.split("-") ?? []
  const selYear  = parts[0] ?? ""
  const selMonth = parts[1] ?? ""

  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: 55 }, (_, i) => thisYear + 2 - i)

  const emit = (y: string, m: string) => {
    if (!y) { onChange(""); return }
    onChange(m ? `${y}-${m.padStart(2, "0")}` : y)
  }

  const presentText = PRESENT_LABEL[lang] ?? "Present"

  return (
    <div className="space-y-1.5">
      {label && <Label className="text-xs text-slate-600">{label}</Label>}
      {isPresent ? (
        <div className="flex items-center gap-2 h-8">
          <span className="text-sm font-semibold text-emerald-600">{presentText}</span>
          {onPresentChange && (
            <button
              type="button"
              onClick={() => onPresentChange(false)}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
            >
              Change
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-1.5 flex-wrap items-center">
          <select
            value={selMonth}
            onChange={(e) => emit(selYear, e.target.value)}
            className="h-8 flex-1 min-w-[90px] rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
          >
            <option value="">Month</option>
            {MONTHS_EN.map((m, i) => (
              <option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>
            ))}
          </select>
          <select
            value={selYear}
            onChange={(e) => emit(e.target.value, selMonth)}
            className="h-8 flex-1 min-w-[70px] rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          {onPresentChange && (
            <button
              type="button"
              onClick={() => { onPresentChange(true); onChange("") }}
              className="h-8 px-2 text-xs text-slate-500 border border-dashed border-slate-300 rounded-md hover:border-emerald-400 hover:text-emerald-600 transition-colors whitespace-nowrap"
            >
              {presentText}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Crop Modal ───────────────────────────────────────────────────────────────

function CropModal({ src, onSave, onClose }: { src: string; onSave: (dataUrl: string) => void; onClose: () => void }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [shape, setShape]   = useState<"circle" | "square">("circle")
  const [zoom, setZoom]     = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const SIZE = 240

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.save()
      if (shape === "circle") {
        ctx.beginPath()
        ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
        ctx.clip()
      }
      const dw = img.width  * zoom
      const dh = img.height * zoom
      const dx = (SIZE - dw) / 2 + offset.x
      const dy = (SIZE - dh) / 2 + offset.y
      ctx.drawImage(img, dx, dy, dw, dh)
      ctx.restore()
      // Overlay ring
      if (shape === "circle") {
        ctx.beginPath()
        ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2)
        ctx.strokeStyle = "#94a3b8"
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
    img.src = src
  }, [src, shape, zoom, offset])

  useEffect(() => { redraw() }, [redraw])

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
  }
  const onMouseUp = () => { dragging.current = false }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onSave(canvas.toDataURL("image/jpeg", 0.92))
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[320px] space-y-4 p-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-slate-900">Crop Photo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex gap-2">
          {(["circle", "square"] as const).map((s) => (
            <button key={s} onClick={() => setShape(s)}
              className={`flex-1 py-1.5 text-xs rounded-lg border capitalize transition-colors ${shape === s ? "border-blue-600 bg-blue-50 text-blue-700 font-medium" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{ borderRadius: shape === "circle" ? "50%" : "8px", cursor: "grab", border: "2px solid #e2e8f0", userSelect: "none" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500"><span>Zoom</span><span>{Math.round(zoom * 100)}%</span></div>
          <input type="range" min="0.3" max="4" step="0.05" value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-blue-600" />
        </div>
        <p className="text-xs text-slate-400 text-center">Drag to reposition · scroll slider to zoom</p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 text-xs" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 text-xs bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
            <CropIcon className="h-3 w-3 mr-1.5" />Save Crop
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Client-side ATS analysis ─────────────────────────────────────────────────

function analyzeResume(
  data: ResumeData,
  switchSection: (s: Section) => void,
  setData: (d: Partial<ResumeData>) => void,
): { score: number; breakdown: Array<{ label: string; score: number; max: number }>; suggestions: ATSSuggestion[] } {
  const sug: ATSSuggestion[] = []
  const go = (s: ATSSuggestion) => sug.push(s)

  // ── Contact (10 pts) ──
  let c = 0
  if (data.contact.firstName || data.contact.lastName) c += 2
  if (data.contact.email) c += 3
  else go({ id: "no-email", priority: "high", section: "contact", title: "Add email address", reason: "ATS and recruiters require an email — without it your application cannot proceed.", fix: "Open Contact and add your professional email.", apply: () => switchSection("contact") })
  if (data.contact.phone) c += 2
  else go({ id: "no-phone", priority: "high", section: "contact", title: "Add phone number", reason: "87% of recruiters call candidates directly before scheduling interviews.", fix: "Add your mobile number in the Contact section.", apply: () => switchSection("contact") })
  if (data.contact.linkedin) c += 2
  else go({ id: "no-linkedin", priority: "medium", section: "contact", title: "Add LinkedIn URL", reason: "Recruiters verify LinkedIn for 95% of candidates before responding.", fix: "Add your linkedin.com/in/username URL.", apply: () => switchSection("contact") })
  if (data.contact.city || data.contact.country) c += 1

  // ── Summary (10 pts) ──
  let s = 0
  const wc = data.summary.trim().split(/\s+/).filter(Boolean).length
  if (wc === 0) {
    go({ id: "no-summary", priority: "high", section: "summary", title: "Write a professional summary", reason: "The summary is the first thing ATS and recruiters read — it frames your entire application.", fix: "Write 30–80 words covering your role, experience level, and top 2 skills.", apply: () => switchSection("summary") })
  } else if (wc < 25) {
    s += 3
    go({ id: "short-summary", priority: "high", section: "summary", title: `Summary too brief (${wc} words)`, reason: "Short summaries score poorly in ATS keyword matching.", fix: "Expand to 35–70 words with measurable impact and key skills.", apply: () => switchSection("summary") })
  } else if (wc > 100) {
    s += 7
    go({ id: "long-summary", priority: "low", section: "summary", title: "Summary may be too long", reason: "Recruiters skim — over 100 words often gets skipped.", fix: "Trim to 50–80 words focusing on value, not history.", apply: () => switchSection("summary") })
  } else { s += 10 }

  // ── Experience (20 pts) ──
  let e = 0
  if (data.experience.length === 0) {
    go({ id: "no-exp", priority: "high", section: "experience", title: "Add work experience", reason: "Experience is the highest-weighted section in ATS scoring.", fix: "Add at least one position with title, company, dates, and bullets.", apply: () => switchSection("experience") })
  } else {
    e += Math.min(8, data.experience.length * 3)
    const missingDates = data.experience.filter((x) => !x.startDate)
    if (missingDates.length > 0) {
      go({ id: "missing-dates", priority: "medium", section: "experience", title: "Missing start dates in experience", reason: "ATS systems flag missing dates and ranking drops significantly.", fix: "Add start (and end) dates for all positions.", apply: () => switchSection("experience") })
    } else { e += 4 }
    const hasMetrics = data.experience.some((x) => /\d+%|\$[\d,]+|\d+\s?x\b|saved|reduced|increased|improved|led\s+\d|team of \d/i.test(x.description))
    if (!hasMetrics) {
      go({ id: "no-metrics", priority: "medium", section: "experience", title: "No quantified achievements", reason: 'Metrics make you 40% more likely to get an interview. "Reduced costs by 30%" beats "Reduced costs."', fix: 'Add numbers: "Reduced load time by 40%", "Managed $2M budget", "Led team of 12".', apply: () => switchSection("experience") })
    } else { e += 4 }
    const weakBullets = data.experience.filter((x) => x.description.trim().length < 60)
    if (weakBullets.length > 0) {
      go({ id: "weak-bullets", priority: "medium", section: "experience", title: `${weakBullets.length} experience entry has thin description`, reason: "Brief descriptions miss critical ATS keywords.", fix: "Add 3–5 bullet points per role using action verbs and specific outcomes.", apply: () => switchSection("experience") })
    } else { e += 4 }
  }

  // ── Education (10 pts) ──
  let ed = 0
  if (data.education.length === 0) {
    go({ id: "no-edu", priority: "high", section: "education", title: "Add education", reason: "Most ATS systems require an education entry — missing it can disqualify you automatically.", fix: "Add your highest qualification.", apply: () => switchSection("education") })
  } else {
    ed += 6
    const incomplete = data.education.filter((x) => !x.degree && !x.field)
    if (incomplete.length > 0) {
      go({ id: "incomplete-edu", priority: "medium", section: "education", title: "Complete degree details", reason: "ATS matches degree type and field to job requirements.", fix: "Add degree type (B.Tech, MBA…) and field of study.", apply: () => switchSection("education") })
    } else { ed += 4 }
  }

  // ── Skills (15 pts) ──
  let sk = 0
  if (data.skills.length === 0) {
    go({ id: "no-skills", priority: "high", section: "skills", title: "Add technical skills", reason: "Skills are directly matched by ATS keyword scanners against job descriptions.", fix: "Add 8–14 relevant technical and soft skills.", apply: () => switchSection("skills") })
  } else if (data.skills.length < 5) {
    sk += 5
    go({ id: "few-skills", priority: "medium", section: "skills", title: `Only ${data.skills.length} skills listed`, reason: "ATS needs enough keywords to confidently match you to the role.", fix: "Add more skills — tools, languages, frameworks, and methodologies.", apply: () => switchSection("skills") })
  } else { sk += 15 }

  // ── Certifications bonus (5 pts) ──
  let cert = data.certifications.length > 0 ? 5 : 0
  if (data.certifications.length === 0) {
    go({ id: "no-certs", priority: "low", section: "certifications", title: "Add certifications (optional but valuable)", reason: "Certifications boost ATS matching for technical and compliance roles.", fix: "Add any professional certifications — AWS, Google, PMP, etc.", apply: () => switchSection("certifications") })
  }

  // ── Photo / template ──
  const isATSSafe = data.template === "classic" || data.template === "minimal"
  if (PHOTO_TEMPLATES.has(data.template) && data.contact.photoDataUrl && (data.targetCountry === "US" || data.targetCountry === "UK" || data.targetCountry === "CA")) {
    go({ id: "photo-bias", priority: "medium", section: "contact", title: "Photo may reduce ATS score in US/UK/CA", reason: "US, UK, and Canadian employers are legally required to avoid bias — photos can trigger rejections.", fix: "Remove photo or switch to Classic (ATS-safe) template.", applyLabel: "Switch to Classic", apply: () => setData({ template: "classic" }) })
  }

  const raw = c + s + e + ed + sk + cert
  const score = Math.round(Math.min(100, (raw / 70) * 100))

  return {
    score,
    breakdown: [
      { label: "Contact",      score: c,    max: 10 },
      { label: "Summary",      score: s,    max: 10 },
      { label: "Experience",   score: e,    max: 20 },
      { label: "Education",    score: ed,   max: 10 },
      { label: "Skills",       score: sk,   max: 15 },
      { label: "Certifications", score: cert, max: 5 },
    ],
    suggestions: sug.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority])),
  }
}

// ─── Builder Client ───────────────────────────────────────────────────────────

interface Props { resumeId: string; userId: string; userRole: string }

export function BuilderClient({ resumeId, userRole }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const { data, updateContact, setData, addExperience, updateExperience, removeExperience } = useResumeStore()

  const [activeSection, setActiveSection] = useState<Section>("contact")
  const [isMounted,   setIsMounted]   = useState(false)
  const [isSaving,    setIsSaving]    = useState(false)
  const [lastSaved,   setLastSaved]   = useState<Date | null>(null)
  const [dbResumeId,  setDbResumeId]  = useState<string | null>(resumeId !== "new" ? resumeId : null)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [atsJobDesc,  setAtsJobDesc]  = useState("")
  const [atsResult,   setAtsResult]   = useState<{ score: number; suggestions: string[] } | null>(null)
  const [atsLoading,  setAtsLoading]  = useState(false)
  const [zoom, setZoom]               = useState(100)
  const [leftTab, setLeftTab]         = useState<"sections" | "design" | "ai">("sections")
  const [isTranslating, setIsTranslating] = useState(false)

  // Photo management
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc,      setCropSrc]      = useState<string | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [dismissedSugs, setDismissedSugs] = useState<Set<string>>(new Set())

  // ── Load resume ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setIsMounted(true)
    if (resumeId === "new") return

    fetch(`/api/resumes/${resumeId}`)
      .then((r) => r.json())
      .then((resume) => {
        const findSection = (type: string) => resume.sections?.find((s: { type: string }) => s.type === type)?.content

        const rawContact  = findSection("CONTACT") || {}
        const rawSkills   = (findSection("SKILLS")?.items          ?? []) as Array<string | { id: string; name: string; level: string }>
        const rawEdu      = (findSection("EDUCATION")?.items        ?? []) as Array<{ id?: string; institution?: string; degree?: string; field?: string; startDate?: string; endDate?: string }>
        const rawExp      = (findSection("EXPERIENCE")?.items       ?? []) as Array<{ id?: string; company?: string; position?: string; startDate?: string; endDate?: string; current?: boolean; description?: string }>
        const rawProjects = (findSection("PROJECTS")?.items         ?? []) as Array<{ id?: string; name?: string; description?: string; url?: string; startDate?: string; endDate?: string }>
        const rawCerts    = (findSection("CERTIFICATIONS")?.items   ?? []) as Array<{ id?: string; name?: string; issuer?: string; date?: string; url?: string }>
        const rawLangs    = (findSection("LANGUAGES")?.items        ?? []) as Array<{ id?: string; language?: string; proficiency?: string } | string>

        const skills: ResumeData["skills"] = rawSkills.map((s, i) =>
          typeof s === "string"
            ? { id: `skill-${i}`, name: s, level: "Intermediate" as const }
            : { id: s.id || `skill-${i}`, name: s.name, level: s.level || "Intermediate" }
        )
        const education: ResumeData["education"] = rawEdu.map((e, i) => ({
          id: e.id || `edu-${i}`, institution: e.institution || "", degree: e.degree || "",
          field: e.field || "", startDate: e.startDate || "", endDate: e.endDate || "",
        }))
        const experience: ResumeData["experience"] = rawExp.map((e, i) => ({
          id: e.id || `exp-${i}`, company: e.company || "", position: e.position || "",
          startDate: e.startDate || "", endDate: e.endDate || "",
          current: e.current ?? false, description: e.description || "",
        }))
        const projects: ResumeData["projects"] = rawProjects.map((p, i) => ({
          id: p.id || `proj-${i}`, name: p.name || "", description: p.description || "",
          url: p.url || "", startDate: p.startDate || "", endDate: p.endDate || "",
        }))
        const certifications: ResumeData["certifications"] = rawCerts.map((c, i) => ({
          id: c.id || `cert-${i}`, name: c.name || "", issuer: c.issuer || "",
          date: c.date || "", url: c.url || "",
        }))
        const languages: ResumeData["languages"] = rawLangs.map((l, i) =>
          typeof l === "string"
            ? { id: `lang-${i}`, language: l, proficiency: "Professional" }
            : { id: l.id || `lang-${i}`, language: l.language || "", proficiency: l.proficiency || "Professional" }
        )

        setData({
          id: resume.id, title: resume.title,
          language: resume.languageCode || "en",
          template: resume.templateId || "modern",
          targetCountry: resume.targetCountry || "US",
          contact: rawContact,
          summary: findSection("SUMMARY")?.text || "",
          experience, education, skills, projects, certifications, languages,
        })
      })
      .catch(() => {})
  }, [resumeId, setData])

  // ── Save ─────────────────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    setIsSaving(true)
    try {
      const sections = [
        { type: "CONTACT",        content: data.contact,                  order: 0 },
        { type: "SUMMARY",        content: { text: data.summary },        order: 1 },
        { type: "EXPERIENCE",     content: { items: data.experience },     order: 2 },
        { type: "EDUCATION",      content: { items: data.education },      order: 3 },
        { type: "SKILLS",         content: { items: data.skills },         order: 4 },
        { type: "LANGUAGES",      content: { items: data.languages },      order: 5 },
        { type: "CERTIFICATIONS", content: { items: data.certifications }, order: 6 },
        { type: "PROJECTS",       content: { items: data.projects },       order: 7 },
      ]
      const body = { title: data.title, languageCode: data.language, templateId: data.template || "modern", targetCountry: data.targetCountry, sections }
      if (!dbResumeId) {
        const res = await fetch("/api/resumes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        const created = await res.json() as { id: string }
        setDbResumeId(created.id)
        router.replace(`/dashboard/builder/${created.id}`)
      } else {
        await fetch(`/api/resumes/${dbResumeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      }
      setLastSaved(new Date())
    } catch {
      toast("Failed to save resume. Please try again.", "error")
    } finally { setIsSaving(false) }
  }, [data, dbResumeId, router, toast])

  useEffect(() => {
    if (!isMounted) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => { void save() }, 3000)
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [data, isMounted, save])

  // ── Photo upload ──────────────────────────────────────────────────────────────

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast("Photo must be under 5 MB", "error"); e.target.value = ""; return
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("Only JPG, PNG, or WEBP photos are accepted", "error"); e.target.value = ""; return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      setCropSrc(src)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleCropSave = (dataUrl: string) => {
    updateContact({ photoDataUrl: dataUrl })
    setShowCropModal(false)
    setCropSrc(null)
    toast("Photo saved", "success")
  }

  const openPhotoUpload = () => photoInputRef.current?.click()

  const openCropModal = () => {
    if (data.contact.photoDataUrl) {
      setCropSrc(data.contact.photoDataUrl)
      setShowCropModal(true)
    } else {
      openPhotoUpload()
    }
  }

  // ── Translation ──────────────────────────────────────────────────────────────

  const handleTranslate = async (targetLang: string) => {
    if (targetLang === data.language || !data.summary) { setData({ language: targetLang }); toast("Language updated", "success"); return }
    setIsTranslating(true)
    try {
      const translated = await translateContent(data.summary, targetLang)
      setData({ summary: translated, language: targetLang })
      toast("Summary translated", "success")
    } catch {
      setData({ language: targetLang })
      toast("Language updated (translation failed)", "info")
    } finally { setIsTranslating(false) }
  }

  // ── PDF download ─────────────────────────────────────────────────────────────

  const handleDownloadPDF = async () => {
    const res = await fetch("/api/resumes/pdf", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeData: data, watermark: userRole !== "ADMIN" }),
    })
    if (res.ok) {
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url
      a.download = `${data.contact.firstName || "resume"}_${data.contact.lastName || ""}_Resume.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (!isMounted) return null

  const showPhotoUpload = PHOTO_TEMPLATES.has(data.template) || SIDEBAR_TEMPLATES.has(data.template)
  const navSections: Section[] = ["contact", "summary", "experience", "education", "skills", "projects", "certifications", "languages", "portfolio"]
  const sectionIcons: Record<Section, React.ReactNode> = {
    contact: <User className="h-5 w-5" />, summary: <FileText className="h-5 w-5" />,
    experience: <Briefcase className="h-5 w-5" />, education: <GraduationCap className="h-5 w-5" />,
    skills: <Code className="h-5 w-5" />, projects: <FolderOpen className="h-5 w-5" />,
    certifications: <CheckSquare className="h-5 w-5" />, languages: <Globe className="h-5 w-5" />,
    portfolio: <BookOpen className="h-5 w-5" />,
  }

  const switchSection = (s: Section) => { setLeftTab("sections"); setActiveSection(s) }

  return (
    <div className="flex h-screen flex-col bg-slate-100 overflow-hidden">
      {/* Hidden file input — single source of truth */}
      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />

      {/* Crop modal */}
      {showCropModal && cropSrc && (
        <CropModal src={cropSrc} onSave={handleCropSave} onClose={() => { setShowCropModal(false); setCropSrc(null) }} />
      )}

      {/* Top bar */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-3 shrink-0 print:hidden gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <Input value={data.title} onChange={(e) => setData({ title: e.target.value })}
            className="w-48 border-transparent hover:border-slate-200 focus-visible:ring-0 font-semibold px-2 h-8 text-sm" />
          <div className="flex items-center gap-1 shrink-0">
            {isSaving
              ? <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin" />
              : lastSaved ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : null}
            {lastSaved && (
              <span className="text-xs text-slate-400 hidden md:block">
                {isSaving ? "Saving…" : `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" disabled><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" disabled><Redo2 className="h-4 w-4" /></Button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => setZoom((z) => Math.max(50, z - 10))}><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs font-mono text-slate-600 w-10 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => setZoom((z) => Math.min(150, z + 10))}><ZoomIn className="h-4 w-4" /></Button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hidden sm:flex" onClick={() => void save()} disabled={isSaving}><Save className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hidden sm:flex" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hidden sm:flex"><Mail className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500"><MoreHorizontal className="h-4 w-4" /></Button>
          <Button className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs font-semibold" onClick={() => void handleDownloadPDF()}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Download
          </Button>
          <Link href="/dashboard/resumes">
            <Button className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3 text-xs font-semibold hidden md:flex">Finish</Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left icon strip */}
        <div className="w-14 bg-slate-900 flex flex-col items-center py-3 gap-1 shrink-0 print:hidden">
          {([
            { id: "sections" as const, icon: <User className="h-5 w-5" />, label: "Edit" },
            { id: "design"   as const, icon: <Palette className="h-5 w-5" />, label: "Design" },
            { id: "ai"       as const, icon: <Sparkles className="h-5 w-5" />, label: "AI" },
          ]).map((tab) => (
            <button key={tab.id} onClick={() => setLeftTab(tab.id)} title={tab.label}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg w-11 text-[9px] font-medium transition-colors ${leftTab === tab.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}>
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
          <div className="w-8 h-px bg-slate-700 my-1" />
          {leftTab === "sections" && navSections.map((s) => (
            <button key={s} onClick={() => setActiveSection(s)} title={SECTION_LABELS[s]}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg w-11 text-[8px] transition-colors ${activeSection === s ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500" : "text-slate-500 hover:bg-slate-700 hover:text-white"}`}>
              {sectionIcons[s]}
              <span className="truncate w-full text-center leading-tight">{SECTION_LABELS[s].split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Editor panel */}
        <div className="w-[340px] bg-white border-r flex flex-col shrink-0 z-10 shadow-md print:hidden">
          {leftTab === "sections" && (
            <>
              <div className="px-4 py-3 border-b bg-slate-50 flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm">{SECTION_LABELS[activeSection]}</span>
              </div>
              <ScrollArea className="flex-1 p-4">
                <SectionEditor
                  section={activeSection}
                  data={data}
                  updateContact={updateContact}
                  setData={setData}
                  addExperience={addExperience}
                  updateExperience={updateExperience}
                  removeExperience={removeExperience}
                  onToast={toast}
                  showPhotoUpload={showPhotoUpload}
                  onPhotoUpload={openPhotoUpload}
                  onCropPhoto={openCropModal}
                  onRemovePhoto={() => updateContact({ photoDataUrl: undefined })}
                />
              </ScrollArea>
            </>
          )}

          {leftTab === "design" && (
            <>
              <div className="px-4 py-3 border-b bg-slate-50">
                <span className="font-semibold text-slate-800 text-sm">Design &amp; Formatting</span>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Template</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["modern", "classic", "minimal", "executive", "german", "french"].map((t) => (
                        <button key={t} onClick={() => setData({ template: t })}
                          className={`border rounded-lg p-2 text-center text-xs cursor-pointer capitalize transition-colors ${data.template === t ? "border-blue-600 bg-blue-50 text-blue-600 font-medium" : "hover:bg-slate-50 text-slate-600"}`}>
                          {t}
                          {(t === "classic" || t === "minimal") && <span className="block text-[9px] text-emerald-600 font-normal">ATS-safe</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  {showPhotoUpload && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1">
                        <Camera className="h-3 w-3" />Profile Photo
                      </Label>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 mb-2 flex gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        Photos may reduce ATS compatibility in US/UK/Canada.
                      </div>
                      {data.contact.photoDataUrl ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={data.contact.photoDataUrl} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-slate-200" />
                          </div>
                          <Button size="sm" variant="outline" className="w-full text-xs" onClick={openPhotoUpload}><Camera className="h-3.5 w-3.5 mr-1.5" />Change Photo</Button>
                          <Button size="sm" variant="outline" className="w-full text-xs" onClick={openCropModal}><CropIcon className="h-3.5 w-3.5 mr-1.5" />Crop Photo</Button>
                          <Button size="sm" variant="outline" className="w-full text-xs text-red-600 hover:bg-red-50" onClick={() => updateContact({ photoDataUrl: undefined })}><X className="h-3.5 w-3.5 mr-1.5" />Remove Photo</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full text-xs" onClick={openPhotoUpload}><Camera className="h-3.5 w-3.5 mr-1.5" />Upload Photo</Button>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Language</Label>
                    <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm"
                      value={data.language} onChange={(e) => void handleTranslate(e.target.value)}>
                      {[["en","English"],["de","German"],["fr","French"],["es","Spanish"],["pt","Portuguese"],["ja","Japanese"],["zh","Chinese"]].map(([v,l]) => (
                        <option key={v} value={v}>{l}{isTranslating && v === data.language ? " (translating…)" : ""}</option>
                      ))}
                    </select>
                    {isTranslating && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3 w-3 animate-spin" />Translating…</div>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Target Country</Label>
                    <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm" value={data.targetCountry} onChange={(e) => setData({ targetCountry: e.target.value })}>
                      <option value="US">USA</option><option value="DE">Germany</option>
                      <option value="UK">United Kingdom</option><option value="FR">France</option>
                      <option value="JP">Japan</option><option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}

          {leftTab === "ai" && (
            <>
              <div className="px-4 py-3 border-b bg-slate-50">
                <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600" />AI Resume Coach
                </span>
              </div>
              <ScrollArea className="flex-1 p-4">
                <AICoachPanel
                  data={data}
                  setData={setData}
                  addExperience={addExperience}
                  updateExperience={updateExperience}
                  atsJobDesc={atsJobDesc}
                  setAtsJobDesc={setAtsJobDesc}
                  atsResult={atsResult}
                  setAtsResult={setAtsResult}
                  atsLoading={atsLoading}
                  setAtsLoading={setAtsLoading}
                  onToast={toast}
                  switchSection={switchSection}
                  dismissedSugs={dismissedSugs}
                  onDismiss={(id) => setDismissedSugs((prev) => new Set([...prev, id]))}
                />
              </ScrollArea>
            </>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 bg-slate-200 overflow-y-auto p-8 flex justify-center print:p-0 print:bg-white">
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.2s ease" }}>
            <ResumePreview data={data} onPhotoClick={openPhotoUpload} onCropPhoto={openCropModal} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AI Coach Panel ───────────────────────────────────────────────────────────

interface AICoachPanelProps {
  data: ResumeData
  setData: (d: Partial<ResumeData>) => void
  addExperience: (e: ResumeData["experience"][0]) => void
  updateExperience: (id: string, e: Partial<ResumeData["experience"][0]>) => void
  atsJobDesc: string
  setAtsJobDesc: (v: string) => void
  atsResult: { score: number; suggestions: string[] } | null
  setAtsResult: (v: { score: number; suggestions: string[] } | null) => void
  atsLoading: boolean
  setAtsLoading: (v: boolean) => void
  onToast: (message: string, type?: ToastType) => void
  switchSection: (s: Section) => void
  dismissedSugs: Set<string>
  onDismiss: (id: string) => void
}

function AICoachPanel({ data, setData, updateExperience, atsJobDesc, setAtsJobDesc, atsResult, setAtsResult, atsLoading, setAtsLoading, onToast, switchSection, dismissedSugs, onDismiss }: AICoachPanelProps) {
  const [genLoading,  setGenLoading]  = useState(false)
  const [rewriteLoading, setRewriteLoading] = useState(false)

  const { score, breakdown, suggestions } = analyzeResume(data, switchSection, setData)
  const activeSugs = suggestions.filter((s) => !dismissedSugs.has(s.id))

  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-500"
  const scoreBg    = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
  const grade      = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B+" : score >= 60 ? "B" : score >= 50 ? "C" : "D"

  const handleGenerateSummary = async () => {
    setGenLoading(true)
    try {
      const jobTitle = data.experience[0]?.position || "Professional"
      const expText  = data.experience.map((e) => `${e.position} at ${e.company}: ${e.description}`).join("\n")
      const result   = await generateSummary(jobTitle, expText, data.language)
      setData({ summary: result })
      onToast("Summary generated", "success")
      switchSection("summary")
    } catch (e) { onToast(e instanceof Error ? e.message : "Failed", "error") }
    finally { setGenLoading(false) }
  }

  const handleRewriteFirst = async () => {
    const exp = data.experience[0]
    if (!exp) { onToast("Add work experience first", "info"); return }
    setRewriteLoading(true)
    try {
      const result = await rewriteBullet(exp.description || exp.position, exp.position, data.language)
      updateExperience(exp.id, { description: result })
      onToast("Bullet rewritten with metrics focus", "success")
    } catch (e) { onToast(e instanceof Error ? e.message : "Failed", "error") }
    finally { setRewriteLoading(false) }
  }

  const handleJobMatch = async () => {
    if (!atsJobDesc.trim()) return
    setAtsLoading(true); setAtsResult(null)
    try {
      const resumeText = [
        `${data.contact.firstName} ${data.contact.lastName}`, data.summary,
        ...data.experience.map((e) => `${e.position} at ${e.company}: ${e.description}`),
        ...data.skills.map((s) => s.name),
      ].join("\n")
      setAtsResult(await optimizeForATS(resumeText, atsJobDesc))
    } catch { setAtsResult({ score: 0, suggestions: ["Analysis failed. Try again."] }) }
    finally { setAtsLoading(false) }
  }

  const PRIORITY_STYLE = {
    high:   { bg: "bg-red-50 border-red-100",    badge: "bg-red-100 text-red-700",    dot: "bg-red-500"    },
    medium: { bg: "bg-amber-50 border-amber-100", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500"  },
    low:    { bg: "bg-blue-50 border-blue-100",   badge: "bg-blue-100 text-blue-700",  dot: "bg-blue-400"   },
  }

  return (
    <div className="space-y-5">
      {/* ATS Score Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">ATS Readiness</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
              <span className="text-slate-400 text-sm">/100</span>
              <span className={`text-lg font-bold ml-1 ${scoreColor}`}>{grade}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">{activeSugs.length} issue{activeSugs.length !== 1 ? "s" : ""} found</p>
            <p className="text-xs text-slate-500 mt-0.5">Updates live</p>
          </div>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${scoreBg}`} style={{ width: `${score}%` }} />
        </div>
        {/* Section breakdown */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {breakdown.map((b) => (
            <div key={b.label} className="bg-slate-700/50 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-slate-400 truncate">{b.label}</p>
              <p className="text-xs font-semibold text-white">{b.score}/{b.max}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Quick AI Actions</p>
        <button onClick={() => void handleGenerateSummary()} disabled={genLoading}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-200 hover:bg-violet-50/40 transition-all text-left group">
          <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 text-violet-600 group-hover:bg-violet-100">
            {genLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Generate Summary</p>
            <p className="text-xs text-slate-500">AI-written, keyword-optimized</p>
          </div>
        </button>
        <button onClick={() => void handleRewriteFirst()} disabled={rewriteLoading}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 transition-all text-left group">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 group-hover:bg-blue-100">
            {rewriteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Rewrite Top Bullet</p>
            <p className="text-xs text-slate-500">Add metrics &amp; action verbs</p>
          </div>
        </button>
      </div>

      {/* Suggestions */}
      {activeSugs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            {activeSugs.length} ATS Improvement{activeSugs.length !== 1 ? "s" : ""}
          </p>
          {activeSugs.map((sug) => {
            const style = PRIORITY_STYLE[sug.priority]
            return (
              <div key={sug.id} className={`rounded-xl border p-3 space-y-2 ${style.bg}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${style.badge}`}>{sug.priority}</span>
                        <p className="text-xs font-semibold text-slate-800">{sug.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{sug.reason}</p>
                    </div>
                  </div>
                  <button onClick={() => onDismiss(sug.id)} className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 ml-4 italic">{sug.fix}</p>
                {sug.apply && (
                  <div className="flex gap-1.5 ml-4">
                    <button onClick={sug.apply}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" />{sug.applyLabel ?? "Fix Now"}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeSugs.length === 0 && score >= 80 && (
        <div className="text-center py-6 space-y-2">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">Great resume!</p>
          <p className="text-xs text-slate-500">No critical issues. Paste a job description below for job-match scoring.</p>
        </div>
      )}

      {/* Job description match */}
      <div className="border-t border-slate-100 pt-4 space-y-2">
        <Label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1">
          <Target className="h-3 w-3" />Job Description Match
        </Label>
        <p className="text-[11px] text-slate-400">Paste a job posting to see how well your resume matches its keywords.</p>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
          placeholder="Paste job description here…"
          value={atsJobDesc}
          onChange={(e) => setAtsJobDesc(e.target.value)}
        />
        <Button size="sm" className="w-full text-xs bg-purple-600 hover:bg-purple-700"
          disabled={atsLoading || !atsJobDesc.trim()}
          onClick={() => void handleJobMatch()}>
          {atsLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Target className="h-3 w-3 mr-1" />}Analyze Match
        </Button>
        {atsResult && (
          <div className="space-y-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Job Match Score</span>
              <span className={`text-sm font-bold ${atsResult.score >= 80 ? "text-emerald-600" : atsResult.score >= 60 ? "text-amber-600" : "text-red-600"}`}>{atsResult.score}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className={`h-full rounded-full ${atsResult.score >= 80 ? "bg-emerald-500" : atsResult.score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${atsResult.score}%` }} />
            </div>
            <ul className="space-y-1.5">
              {atsResult.suggestions.map((s, i) => (
                <li key={i} className="text-xs text-slate-600 flex gap-1.5 p-2 bg-slate-50 rounded-lg">
                  <Star className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section Editor ───────────────────────────────────────────────────────────

interface SectionEditorProps {
  section: Section
  data: ResumeData
  updateContact: (c: Partial<ResumeData["contact"]>) => void
  setData: (d: Partial<ResumeData>) => void
  addExperience: (e: Experience) => void
  updateExperience: (id: string, e: Partial<Experience>) => void
  removeExperience: (id: string) => void
  onToast: (message: string, type?: ToastType) => void
  showPhotoUpload: boolean
  onPhotoUpload: () => void
  onCropPhoto: () => void
  onRemovePhoto: () => void
}

function SectionEditor({ section, data, updateContact, setData, addExperience, updateExperience, removeExperience, onToast, showPhotoUpload, onPhotoUpload, onCropPhoto, onRemovePhoto }: SectionEditorProps) {
  const [aiLoading, setAiLoading] = useState<string | null>(null)

  const handleGenerateSummary = async () => {
    setAiLoading("summary")
    try {
      const jobTitle = data.experience[0]?.position || "Professional"
      const expText  = data.experience.map((e) => `${e.position} at ${e.company}: ${e.description}`).join("\n")
      const result   = await generateSummary(jobTitle, expText, data.language)
      setData({ summary: result })
      onToast("Summary generated", "success")
    } catch (e) { onToast(e instanceof Error ? e.message : "Failed", "error") }
    finally { setAiLoading(null) }
  }

  const handleRewriteBullet = async (expId: string, description: string, position: string) => {
    setAiLoading(expId)
    try {
      const result = await rewriteBullet(description, position, data.language)
      updateExperience(expId, { description: result })
      onToast("Bullet rewritten", "success")
    } catch (e) { onToast(e instanceof Error ? e.message : "Failed", "error") }
    finally { setAiLoading(null) }
  }

  // ── Contact ───────────────────────────────────────────────────────────────────
  if (section === "contact") {
    return (
      <div className="space-y-4">
        {showPhotoUpload && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><Camera className="h-3 w-3" />Profile Photo</Label>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-[11px] text-amber-700 flex gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />Photos may reduce ATS score in US/UK/CA markets.
            </div>
            <div className="flex items-center gap-3">
              {data.contact.photoDataUrl ? (
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.contact.photoDataUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover border-2 border-slate-200" />
                </div>
              ) : (
                <button onClick={onPhotoUpload}
                  className="h-16 w-16 rounded-full border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors shrink-0 gap-1">
                  <Camera className="h-5 w-5 text-slate-400" />
                  <span className="text-[9px] text-slate-400">Upload</span>
                </button>
              )}
              <div className="flex-1 space-y-1.5">
                <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={onPhotoUpload}>
                  <Camera className="h-3 w-3 mr-1.5" />{data.contact.photoDataUrl ? "Change Photo" : "Upload Photo"}
                </Button>
                {data.contact.photoDataUrl && (
                  <>
                    <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={onCropPhoto}>
                      <CropIcon className="h-3 w-3 mr-1.5" />Crop / Adjust
                    </Button>
                    <Button size="sm" variant="outline" className="w-full text-xs h-7 text-red-600 hover:bg-red-50" onClick={onRemovePhoto}>
                      <X className="h-3 w-3 mr-1.5" />Remove Photo
                    </Button>
                  </>
                )}
                <p className="text-[10px] text-slate-400">JPG, PNG, WEBP · max 5 MB</p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>First Name</Label><Input value={data.contact.firstName} onChange={(e) => updateContact({ firstName: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Last Name</Label><Input value={data.contact.lastName} onChange={(e) => updateContact({ lastName: e.target.value })} /></div>
        </div>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={data.contact.email} onChange={(e) => updateContact({ email: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Phone</Label><Input value={data.contact.phone} onChange={(e) => updateContact({ phone: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>City</Label><Input value={data.contact.city} onChange={(e) => updateContact({ city: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Country</Label><Input value={data.contact.country} onChange={(e) => updateContact({ country: e.target.value })} /></div>
        </div>
        <div className="space-y-1.5"><Label>LinkedIn URL</Label><Input value={data.contact.linkedin} onChange={(e) => updateContact({ linkedin: e.target.value })} placeholder="linkedin.com/in/yourname" /></div>
        <div className="space-y-1.5"><Label>Website / Portfolio</Label><Input value={data.contact.website} onChange={(e) => updateContact({ website: e.target.value })} /></div>
      </div>
    )
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  if (section === "summary") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Professional Summary</Label>
          <Button size="sm" variant="outline" onClick={() => void handleGenerateSummary()} disabled={aiLoading === "summary"} className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
            {aiLoading === "summary" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}AI Generate
          </Button>
        </div>
        <textarea
          className="flex min-h-[150px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
          value={data.summary}
          onChange={(e) => setData({ summary: e.target.value })}
          placeholder="Write a compelling 3–4 sentence summary highlighting your role, expertise, and key impact…" />
        <p className="text-xs text-slate-400">{data.summary.trim().split(/\s+/).filter(Boolean).length} words · aim for 35–80</p>
      </div>
    )
  }

  // ── Experience ────────────────────────────────────────────────────────────────
  if (section === "experience") {
    return (
      <div className="space-y-4">
        <Button className="w-full" variant="outline" onClick={() => addExperience({ id: crypto.randomUUID(), company: "", position: "", startDate: "", endDate: "", current: false, description: "" })}>
          <Plus className="h-4 w-4 mr-2" />Add Experience
        </Button>
        {data.experience.map((exp) => (
          <div key={exp.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700 truncate pr-2">{exp.company || "New Experience"}</span>
              <button onClick={() => removeExperience(exp.id)} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1.5"><Label>Company / Organisation</Label><Input value={exp.company} onChange={(e) => updateExperience(exp.id, { company: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Job Title / Role</Label><Input value={exp.position} onChange={(e) => updateExperience(exp.id, { position: e.target.value })} /></div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Date Range</Label>
              <MonthYearPicker
                label="Start date"
                value={exp.startDate}
                onChange={(v) => updateExperience(exp.id, { startDate: v })}
                lang={data.language}
              />
              <MonthYearPicker
                label="End date"
                value={exp.endDate}
                onChange={(v) => updateExperience(exp.id, { endDate: v, current: false })}
                isPresent={exp.current}
                onPresentChange={(v) => updateExperience(exp.id, { current: v, endDate: v ? "" : exp.endDate })}
                lang={data.language}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Key Achievements</Label>
                <Button size="sm" variant="outline" onClick={() => void handleRewriteBullet(exp.id, exp.description, exp.position)} disabled={aiLoading === exp.id || !exp.description.trim()} className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
                  {aiLoading === exp.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}AI Rewrite
                </Button>
              </div>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                value={exp.description}
                onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                placeholder="• Led a team of 5 engineers…&#10;• Reduced latency by 40%…&#10;• Shipped feature used by 50k users…" />
            </div>
          </div>
        ))}
        {data.experience.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
            <Briefcase className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p>No experience added yet.</p>
            <p className="text-xs mt-1">Click Add Experience to start.</p>
          </div>
        )}
      </div>
    )
  }

  // ── Education ─────────────────────────────────────────────────────────────────
  if (section === "education") {
    return (
      <div className="space-y-4">
        <Button className="w-full" variant="outline" onClick={() => setData({ education: [...data.education, { id: crypto.randomUUID(), institution: "", degree: "", field: "", startDate: "", endDate: "" }] })}>
          <Plus className="h-4 w-4 mr-2" />Add Education
        </Button>
        {data.education.map((edu: Education, i: number) => (
          <div key={edu.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700 truncate pr-2">{edu.institution || "New Education"}</span>
              <button onClick={() => setData({ education: data.education.filter((_: Education, idx: number) => idx !== i) })} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1.5"><Label>Institution / University</Label><Input value={edu.institution} onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], institution: e.target.value }; setData({ education: u }) }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Degree</Label><Input value={edu.degree} placeholder="B.Tech, MBA…" onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], degree: e.target.value }; setData({ education: u }) }} /></div>
              <div className="space-y-1.5"><Label>Field</Label><Input value={edu.field} placeholder="Computer Science…" onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], field: e.target.value }; setData({ education: u }) }} /></div>
            </div>
            <MonthYearPicker
              label="Start date"
              value={edu.startDate}
              onChange={(v) => { const u = [...data.education]; u[i] = { ...u[i], startDate: v }; setData({ education: u }) }}
              lang={data.language}
            />
            <MonthYearPicker
              label="End date (or expected)"
              value={edu.endDate}
              onChange={(v) => { const u = [...data.education]; u[i] = { ...u[i], endDate: v }; setData({ education: u }) }}
              lang={data.language}
            />
          </div>
        ))}
      </div>
    )
  }

  // ── Skills ────────────────────────────────────────────────────────────────────
  if (section === "skills") {
    return (
      <div className="space-y-4">
        <Button className="w-full" variant="outline" onClick={() => setData({ skills: [...data.skills, { id: crypto.randomUUID(), name: "", level: "Intermediate" }] })}>
          <Plus className="h-4 w-4 mr-2" />Add Skill
        </Button>
        {data.skills.map((skill: Skill, i: number) => (
          <div key={skill.id} className="flex gap-2 items-center">
            <Input placeholder="e.g. React, Python, Figma" value={skill.name} onChange={(e) => { const u = [...data.skills]; u[i] = { ...u[i], name: e.target.value }; setData({ skills: u }) }} className="flex-1" />
            <select className="h-9 rounded-md border border-slate-200 bg-transparent px-2 py-1 text-sm" value={skill.level} onChange={(e) => { const u = [...data.skills]; u[i] = { ...u[i], level: e.target.value }; setData({ skills: u }) }}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Expert</option>
            </select>
            <button onClick={() => setData({ skills: data.skills.filter((_: Skill, idx: number) => idx !== i) })} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    )
  }

  // ── Projects ──────────────────────────────────────────────────────────────────
  if (section === "projects") {
    return (
      <div className="space-y-4">
        <Button className="w-full" variant="outline" onClick={() => setData({ projects: [...data.projects, { id: crypto.randomUUID(), name: "", description: "", url: "", startDate: "", endDate: "" }] })}>
          <Plus className="h-4 w-4 mr-2" />Add Project
        </Button>
        {data.projects.map((proj: Project, i: number) => (
          <div key={proj.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700 truncate pr-2">{proj.name || "New Project"}</span>
              <button onClick={() => setData({ projects: data.projects.filter((_: Project, idx: number) => idx !== i) })} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1.5"><Label>Project Name</Label><Input value={proj.name} onChange={(e) => { const u = [...data.projects]; u[i] = { ...u[i], name: e.target.value }; setData({ projects: u }) }} /></div>
            <div className="space-y-1.5"><Label>URL (optional)</Label><Input value={proj.url} placeholder="https://github.com/…" onChange={(e) => { const u = [...data.projects]; u[i] = { ...u[i], url: e.target.value }; setData({ projects: u }) }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <MonthYearPicker label="Start" value={proj.startDate} onChange={(v) => { const u = [...data.projects]; u[i] = { ...u[i], startDate: v }; setData({ projects: u }) }} lang={data.language} />
              <MonthYearPicker label="End" value={proj.endDate} onChange={(v) => { const u = [...data.projects]; u[i] = { ...u[i], endDate: v }; setData({ projects: u }) }} lang={data.language} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                value={proj.description}
                onChange={(e) => { const u = [...data.projects]; u[i] = { ...u[i], description: e.target.value }; setData({ projects: u }) }}
                placeholder="Built a tool that…" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Certifications ────────────────────────────────────────────────────────────
  if (section === "certifications") {
    return (
      <div className="space-y-4">
        <Button className="w-full" variant="outline" onClick={() => setData({ certifications: [...data.certifications, { id: crypto.randomUUID(), name: "", issuer: "", date: "", url: "" }] })}>
          <Plus className="h-4 w-4 mr-2" />Add Certification
        </Button>
        {data.certifications.map((cert: Certification, i: number) => (
          <div key={cert.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700 truncate pr-2">{cert.name || "New Certification"}</span>
              <button onClick={() => setData({ certifications: data.certifications.filter((_: Certification, idx: number) => idx !== i) })} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1.5"><Label>Certification Name</Label><Input value={cert.name} onChange={(e) => { const u = [...data.certifications]; u[i] = { ...u[i], name: e.target.value }; setData({ certifications: u }) }} /></div>
            <div className="space-y-1.5"><Label>Issuing Organisation</Label><Input value={cert.issuer} onChange={(e) => { const u = [...data.certifications]; u[i] = { ...u[i], issuer: e.target.value }; setData({ certifications: u }) }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <MonthYearPicker label="Date issued" value={cert.date} onChange={(v) => { const u = [...data.certifications]; u[i] = { ...u[i], date: v }; setData({ certifications: u }) }} lang={data.language} />
              <div className="space-y-1.5"><Label>Verify URL</Label><Input value={cert.url} placeholder="https://…" onChange={(e) => { const u = [...data.certifications]; u[i] = { ...u[i], url: e.target.value }; setData({ certifications: u }) }} /></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Languages ─────────────────────────────────────────────────────────────────
  if (section === "languages") {
    return (
      <div className="space-y-4">
        <Button className="w-full" variant="outline" onClick={() => setData({ languages: [...data.languages, { id: crypto.randomUUID(), language: "", proficiency: "Professional" }] })}>
          <Plus className="h-4 w-4 mr-2" />Add Language
        </Button>
        {data.languages.map((lang: Lang, i: number) => (
          <div key={lang.id} className="flex gap-2 items-center">
            <Input placeholder="Language" value={lang.language} onChange={(e) => { const u = [...data.languages]; u[i] = { ...u[i], language: e.target.value }; setData({ languages: u }) }} className="flex-1" />
            <select className="h-9 rounded-md border border-slate-200 bg-transparent px-2 py-1 text-sm" value={lang.proficiency} onChange={(e) => { const u = [...data.languages]; u[i] = { ...u[i], proficiency: e.target.value }; setData({ languages: u }) }}>
              <option>Native</option><option>Fluent</option><option>Professional</option><option>Conversational</option><option>Basic</option>
            </select>
            <button onClick={() => setData({ languages: data.languages.filter((_: Lang, idx: number) => idx !== i) })} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm text-center">
      <Circle className="h-8 w-8 mx-auto mb-2 text-slate-200" />
      <p>This section is coming soon.</p>
    </div>
  )
}

// ─── Resume Preview ───────────────────────────────────────────────────────────

interface PhotoClickProps { onPhotoClick: () => void; onCropPhoto: () => void }

function ResumePreview({ data, onPhotoClick, onCropPhoto }: { data: ResumeData } & PhotoClickProps) {
  const lang  = data.language || "en"
  const tmpl  = data.template || "modern"
  const photo = data.contact.photoDataUrl

  if (tmpl === "minimal" || tmpl === "ats-friendly") return <MinimalTemplate data={data} lang={lang} />
  if (tmpl === "classic") return <ClassicTemplate data={data} lang={lang} />
  if (tmpl === "executive") return <ExecutiveTemplate data={data} lang={lang} />
  if (SIDEBAR_TEMPLATES.has(tmpl)) return <SidebarTemplate data={data} lang={lang} photo={photo} onPhotoClick={onPhotoClick} onCropPhoto={onCropPhoto} />
  if (tmpl === "german" || tmpl === "japanese") return <PhotoHeaderTemplate data={data} lang={lang} photo={photo} onPhotoClick={onPhotoClick} onCropPhoto={onCropPhoto} />
  return <ModernTemplate data={data} lang={lang} />
}

// ── Shared styles ──

const PAGE = "bg-white shadow-xl w-[210mm] min-h-[297mm] print:shadow-none print:min-h-0"
const RULE = "border-b border-slate-200 mb-2 pb-1"

function SectionHead({ title, accent = "#3B82F6" }: { title: string; accent?: string }) {
  return (
    <div className={RULE}>
      <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>{title}</h2>
    </div>
  )
}

// ── Clickable photo wrapper ──

function PhotoSlot({
  photo, onPhotoClick, onCropPhoto, circle = false, className = "",
}: { photo?: string; onPhotoClick: () => void; onCropPhoto: () => void; circle?: boolean; className?: string }) {
  const [hover, setHover] = useState(false)
  const rounded = circle ? "rounded-full" : "rounded-md"

  return (
    <div
      className={`relative cursor-pointer select-none ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onPhotoClick}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="Profile" className={`w-full h-full object-cover ${rounded}`} />
      ) : (
        <div className={`w-full h-full border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-1 ${rounded}`}>
          <Camera className="h-6 w-6 text-slate-300" />
          <span className="text-[9px] text-slate-400 text-center px-1">Click to add photo</span>
        </div>
      )}
      {hover && (
        <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1.5 ${rounded}`}>
          <span className="text-[10px] text-white font-semibold bg-black/40 px-2 py-0.5 rounded-full">{photo ? "Change" : "Upload"}</span>
          {photo && (
            <button
              onClick={(e) => { e.stopPropagation(); onCropPhoto() }}
              className="text-[10px] text-white font-semibold bg-black/40 px-2 py-0.5 rounded-full hover:bg-black/60"
            >
              Crop
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Modern Template ───────────────────────────────────────────────────────────

function ModernTemplate({ data, lang }: { data: ResumeData; lang: string }) {
  const accent = "#3B82F6"
  const name   = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()
  return (
    <div className={PAGE} style={{ padding: "18mm 20mm", fontSize: "10.5pt", lineHeight: "1.45", fontFamily: "system-ui, sans-serif" }}>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{name}</h1>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-sm text-slate-500">
          {data.contact.email    && <span>{data.contact.email}</span>}
          {data.contact.phone    && <><span className="text-slate-300">·</span><span>{data.contact.phone}</span></>}
          {(data.contact.city || data.contact.country) && <><span className="text-slate-300">·</span><span>{[data.contact.city, data.contact.country].filter(Boolean).join(", ")}</span></>}
          {data.contact.linkedin && <><span className="text-slate-300">·</span><span style={{ color: accent }}>{data.contact.linkedin}</span></>}
          {data.contact.website  && <><span className="text-slate-300">·</span><span style={{ color: accent }}>{data.contact.website}</span></>}
        </div>
        <div className="h-1 w-20 mx-auto mt-3 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <ResumeBody data={data} lang={lang} accent={accent} />
    </div>
  )
}

// ── Classic / ATS Template ────────────────────────────────────────────────────

function ClassicTemplate({ data, lang }: { data: ResumeData; lang: string }) {
  const accent      = "#1F2937"
  const name        = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()
  const contactLine = [data.contact.email, data.contact.phone, [data.contact.city, data.contact.country].filter(Boolean).join(", "), data.contact.linkedin].filter(Boolean).join("  |  ")
  return (
    <div className={PAGE} style={{ padding: "18mm 20mm", fontSize: "10.5pt", lineHeight: "1.45", fontFamily: "Georgia, serif" }}>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
        <p className="text-xs text-slate-500 mt-1">{contactLine}</p>
        <div className="h-px bg-slate-900 mt-3" />
      </div>
      <ResumeBody data={data} lang={lang} accent={accent} headingStyle="UPPERCASE" />
    </div>
  )
}

// ── Executive Template ────────────────────────────────────────────────────────

function ExecutiveTemplate({ data, lang }: { data: ResumeData; lang: string }) {
  const accent = "#D97706"
  const header = "#0F172A"
  const name   = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()
  return (
    <div className={PAGE} style={{ fontSize: "10.5pt", lineHeight: "1.45", fontFamily: "Georgia, serif" }}>
      <div style={{ backgroundColor: header, padding: "14mm 20mm 10mm" }}>
        <h1 className="text-3xl font-bold text-white tracking-wide">{name}</h1>
        <div className="flex flex-wrap gap-x-4 mt-2 text-sm" style={{ color: accent }}>
          {data.contact.email    && <span>{data.contact.email}</span>}
          {data.contact.phone    && <span>{data.contact.phone}</span>}
          {(data.contact.city || data.contact.country) && <span>{[data.contact.city, data.contact.country].filter(Boolean).join(", ")}</span>}
          {data.contact.linkedin && <span>{data.contact.linkedin}</span>}
        </div>
      </div>
      <div style={{ padding: "14mm 20mm" }}>
        <ResumeBody data={data} lang={lang} accent={accent} headingStyle="UPPERCASE" />
      </div>
    </div>
  )
}

// ── Minimal Template ──────────────────────────────────────────────────────────

function MinimalTemplate({ data, lang }: { data: ResumeData; lang: string }) {
  const accent = "#334155"
  const name   = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()
  return (
    <div className={PAGE} style={{ padding: "20mm 22mm", fontSize: "10.5pt", lineHeight: "1.5", fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{name}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {[data.contact.email, data.contact.phone, [data.contact.city, data.contact.country].filter(Boolean).join(", "), data.contact.linkedin].filter(Boolean).join(" · ")}
        </p>
      </div>
      <ResumeBody data={data} lang={lang} accent={accent} headingStyle="MINIMAL" />
    </div>
  )
}

// ── Sidebar Template ──────────────────────────────────────────────────────────

function SidebarTemplate({ data, lang, photo, onPhotoClick, onCropPhoto }: { data: ResumeData; lang: string; photo?: string } & PhotoClickProps) {
  const accent    = data.template === "creative" ? "#7C3AED" : data.template === "french" ? "#2563EB" : "#3B82F6"
  const sidebarBg = data.template === "creative" ? "#1e1b4b" : data.template === "french" ? "#1e3a8a" : "#1e3a5f"
  const name      = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()

  return (
    <div className={`${PAGE} flex`} style={{ fontSize: "10pt", lineHeight: "1.45", fontFamily: "system-ui, sans-serif" }}>
      {/* Sidebar */}
      <div className="w-[38%] shrink-0 flex flex-col" style={{ backgroundColor: sidebarBg, padding: "16mm 10mm" }}>
        <div className="flex justify-center mb-4">
          <PhotoSlot photo={photo} onPhotoClick={onPhotoClick} onCropPhoto={onCropPhoto} circle className="w-24 h-24 border-4 border-white/20" />
        </div>
        <h1 className="text-lg font-bold text-white text-center leading-tight mb-1">{name}</h1>
        <div className="h-0.5 w-10 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <div className="space-y-2 text-xs text-white/70">
          {data.contact.email    && <div className="break-all">{data.contact.email}</div>}
          {data.contact.phone    && <div>{data.contact.phone}</div>}
          {(data.contact.city || data.contact.country) && <div>{[data.contact.city, data.contact.country].filter(Boolean).join(", ")}</div>}
          {data.contact.linkedin && <div className="break-all" style={{ color: "rgba(147,197,253,1)" }}>{data.contact.linkedin}</div>}
          {data.contact.website  && <div className="break-all" style={{ color: "rgba(147,197,253,1)" }}>{data.contact.website}</div>}
        </div>
        {data.skills.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">{h(lang, "skills")}</h3>
            <div className="space-y-1.5">
              {data.skills.map((s) => (
                <div key={s.id}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-white/80">{s.name}</span>
                    <span className="text-[10px] text-white/50">{s.level}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/20">
                    <div className="h-full rounded-full" style={{ width: s.level === "Expert" ? "95%" : s.level === "Advanced" ? "80%" : s.level === "Beginner" ? "35%" : "60%", backgroundColor: accent }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col" style={{ padding: "16mm 14mm" }}>
        <ResumeBody data={data} lang={lang} accent={accent} skipSkills />
      </div>
    </div>
  )
}

// ── Photo Header Template (German / Japanese) ─────────────────────────────────

function PhotoHeaderTemplate({ data, lang, photo, onPhotoClick, onCropPhoto }: { data: ResumeData; lang: string; photo?: string } & PhotoClickProps) {
  const isJapanese = data.template === "japanese"
  const accent     = "#DC2626"
  const name       = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()
  const contact    = [data.contact.email, data.contact.phone, [data.contact.city, data.contact.country].filter(Boolean).join(", "), data.contact.linkedin].filter(Boolean)

  return (
    <div className={PAGE} style={{ padding: "18mm 20mm", fontSize: "10.5pt", lineHeight: "1.5", fontFamily: "system-ui, sans-serif" }}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 pr-6">
          <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
          <div className="h-0.5 w-12 mt-2 mb-3" style={{ backgroundColor: accent }} />
          <div className="space-y-1">
            {contact.map((c, i) => <p key={i} className="text-xs text-slate-600">{c}</p>)}
          </div>
        </div>
        <PhotoSlot
          photo={photo}
          onPhotoClick={onPhotoClick}
          onCropPhoto={onCropPhoto}
          circle={!isJapanese}
          className={isJapanese ? "w-24 h-32 shrink-0" : "w-24 h-24 shrink-0"}
        />
      </div>
      <div className="h-px bg-slate-200 mb-5" />
      <ResumeBody data={data} lang={lang} accent={accent} />
    </div>
  )
}

// ── Shared Resume Body ────────────────────────────────────────────────────────

type HeadingStyle = "NORMAL" | "UPPERCASE" | "MINIMAL"

function ResumeBody({ data, lang, accent = "#3B82F6", headingStyle = "NORMAL", skipSkills = false }: {
  data: ResumeData; lang: string; accent?: string; headingStyle?: HeadingStyle; skipSkills?: boolean
}) {
  const presentLabel = PRESENT_LABEL[lang] ?? "Present"

  function SHead({ title }: { title: string }) {
    if (headingStyle === "MINIMAL")   return <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-0.5 mb-2">{title}</h2>
    if (headingStyle === "UPPERCASE") return <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600 border-b border-slate-200 pb-1 mb-2">{title}</h2>
    return <SectionHead title={title} accent={accent} />
  }

  return (
    <div className="space-y-5">
      {data.summary && (
        <section>
          <SHead title={h(lang, "summary")} />
          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section>
          <SHead title={h(lang, "experience")} />
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{exp.position || "Position"}</p>
                    <p className="text-sm" style={{ color: accent }}>{exp.company || "Company"}</p>
                  </div>
                  <p className="text-xs text-slate-500 shrink-0 ml-2 text-right">
                    {fmt(exp.startDate, lang)}
                    {(exp.startDate || exp.current || exp.endDate) && " – "}
                    {exp.current ? presentLabel : fmt(exp.endDate, lang)}
                  </p>
                </div>
                {exp.description && (
                  <div className="mt-1.5 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{exp.description}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education.length > 0 && (
        <section>
          <SHead title={h(lang, "education")} />
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {[edu.degree, edu.field].filter(Boolean).join(" in ") || "Degree"}
                  </p>
                  <p className="text-sm" style={{ color: accent }}>{edu.institution || "Institution"}</p>
                </div>
                <p className="text-xs text-slate-500 shrink-0 ml-2">
                  {fmt(edu.startDate, lang)}{edu.endDate ? ` – ${fmt(edu.endDate, lang)}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!skipSkills && data.skills.length > 0 && (
        <section>
          <SHead title={h(lang, "skills")} />
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill) => (
              <span key={skill.id} className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-700">
                {skill.name}{skill.level !== "Intermediate" ? ` · ${skill.level}` : ""}
              </span>
            ))}
          </div>
        </section>
      )}

      {data.projects && data.projects.length > 0 && (
        <section>
          <SHead title={h(lang, "projects")} />
          <div className="space-y-3">
            {data.projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-slate-900 text-sm">
                    {proj.name || "Project"}
                    {proj.url && <span className="font-normal text-xs ml-2" style={{ color: accent }}>{proj.url}</span>}
                  </p>
                  {(proj.startDate || proj.endDate) && (
                    <p className="text-xs text-slate-500 shrink-0 ml-2">
                      {fmt(proj.startDate, lang)}{proj.endDate ? ` – ${fmt(proj.endDate, lang)}` : ""}
                    </p>
                  )}
                </div>
                {proj.description && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{proj.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <section>
          <SHead title={h(lang, "certifications")} />
          <div className="space-y-2">
            {data.certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{cert.name || "Certification"}</p>
                  {cert.issuer && <p className="text-xs" style={{ color: accent }}>{cert.issuer}</p>}
                </div>
                {cert.date && <p className="text-xs text-slate-500 shrink-0 ml-2">{fmt(cert.date, lang)}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.languages && data.languages.length > 0 && (
        <section>
          <SHead title={h(lang, "languages")} />
          <div className="flex flex-wrap gap-1.5">
            {data.languages.map((l) => (
              <span key={l.id} className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-700">
                {l.language}{l.proficiency ? ` · ${l.proficiency}` : ""}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
