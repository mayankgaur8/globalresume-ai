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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { generateSummary, rewriteBullet, optimizeForATS, translateContent } from "@/actions/ai"
import { useToast, type ToastType } from "@/components/ui/toaster"

type Section = "contact" | "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "languages" | "portfolio"
type Experience     = ResumeData["experience"][number]
type Education      = ResumeData["education"][number]
type Skill          = ResumeData["skills"][number]
type Project        = ResumeData["projects"][number]
type Certification  = ResumeData["certifications"][number]
type Lang           = ResumeData["languages"][number]

const SECTION_LABELS: Record<Section, string> = {
  contact: "Contact", summary: "Summary", experience: "Work History",
  education: "Education", skills: "Skills", projects: "Projects",
  certifications: "Certifications", languages: "Languages", portfolio: "Portfolio",
}

// ── Multilingual section headings ─────────────────────────────────────────────

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

// ── Photo template list ───────────────────────────────────────────────────────

const PHOTO_TEMPLATES = new Set(["german", "french", "japanese", "creative"])
const SIDEBAR_TEMPLATES = new Set(["modern", "creative", "french", "global"])

interface Props { resumeId: string; userId: string; userRole: string }

export function BuilderClient({ resumeId, userRole }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const { data, updateContact, setData, addExperience, updateExperience, removeExperience } = useResumeStore()

  const [activeSection, setActiveSection] = useState<Section>("contact")
  const [isMounted, setIsMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [dbResumeId, setDbResumeId] = useState<string | null>(resumeId !== "new" ? resumeId : null)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [atsJobDesc, setAtsJobDesc] = useState("")
  const [atsResult, setAtsResult] = useState<{ score: number; suggestions: string[] } | null>(null)
  const [atsLoading, setAtsLoading] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [leftTab, setLeftTab] = useState<"sections" | "design" | "ai">("sections")
  const [isTranslating, setIsTranslating] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // ── Load resume ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setIsMounted(true)
    if (resumeId === "new") return

    fetch(`/api/resumes/${resumeId}`)
      .then((r) => r.json())
      .then((resume) => {
        const findSection = (type: string) => resume.sections?.find((s: { type: string }) => s.type === type)?.content

        const rawContact = findSection("CONTACT") || {}
        const rawSkills  = (findSection("SKILLS")?.items        ?? []) as Array<string | { id: string; name: string; level: string }>
        const rawEdu     = (findSection("EDUCATION")?.items     ?? []) as Array<{ id?: string; institution?: string; degree?: string; field?: string; startDate?: string; endDate?: string }>
        const rawExp     = (findSection("EXPERIENCE")?.items    ?? []) as Array<{ id?: string; company?: string; position?: string; startDate?: string; endDate?: string; current?: boolean; description?: string }>
        const rawProjects = (findSection("PROJECTS")?.items     ?? []) as Array<{ id?: string; name?: string; description?: string; url?: string; startDate?: string; endDate?: string }>
        const rawCerts   = (findSection("CERTIFICATIONS")?.items ?? []) as Array<{ id?: string; name?: string; issuer?: string; date?: string; url?: string }>
        const rawLangs   = (findSection("LANGUAGES")?.items     ?? []) as Array<{ id?: string; language?: string; proficiency?: string } | string>

        // Normalize skills: string[] (from parser) → {id,name,level}[]
        const skills: ResumeData["skills"] = rawSkills.map((s, i) =>
          typeof s === "string"
            ? { id: `skill-${i}`, name: s, level: "Intermediate" as const }
            : { id: s.id || `skill-${i}`, name: s.name, level: (s.level as string) || "Intermediate" }
        )

        // Normalize education: ensure id field
        const education: ResumeData["education"] = rawEdu.map((e, i) => ({
          id: e.id || `edu-${i}`,
          institution: e.institution || "",
          degree: e.degree || "",
          field: e.field || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
        }))

        // Normalize experience: ensure id and description fields
        const experience: ResumeData["experience"] = rawExp.map((e, i) => ({
          id: e.id || `exp-${i}`,
          company: e.company || "",
          position: e.position || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          current: e.current ?? false,
          description: e.description || "",
        }))

        const projects: ResumeData["projects"] = rawProjects.map((p, i) => ({
          id: p.id || `proj-${i}`,
          name: p.name || "",
          description: p.description || "",
          url: p.url || "",
          startDate: p.startDate || "",
          endDate: p.endDate || "",
        }))

        const certifications: ResumeData["certifications"] = rawCerts.map((c, i) => ({
          id: c.id || `cert-${i}`,
          name: c.name || "",
          issuer: c.issuer || "",
          date: c.date || "",
          url: c.url || "",
        }))

        const languages: ResumeData["languages"] = rawLangs.map((l, i) =>
          typeof l === "string"
            ? { id: `lang-${i}`, language: l, proficiency: "Professional" }
            : { id: l.id || `lang-${i}`, language: l.language || "", proficiency: l.proficiency || "Professional" }
        )

        setData({
          id: resume.id,
          title: resume.title,
          language: resume.languageCode || "en",
          template: resume.templateId || "modern",
          targetCountry: resume.targetCountry || "US",
          contact: rawContact,
          summary: findSection("SUMMARY")?.text || "",
          experience,
          education,
          skills,
          projects,
          certifications,
          languages,
        })
      })
      .catch(() => {})
  }, [resumeId, setData])

  // ── Save ────────────────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    setIsSaving(true)
    try {
      const sections = [
        { type: "CONTACT",        content: data.contact,                      order: 0 },
        { type: "SUMMARY",        content: { text: data.summary },            order: 1 },
        { type: "EXPERIENCE",     content: { items: data.experience },         order: 2 },
        { type: "EDUCATION",      content: { items: data.education },          order: 3 },
        { type: "SKILLS",         content: { items: data.skills },             order: 4 },
        { type: "LANGUAGES",      content: { items: data.languages },          order: 5 },
        { type: "CERTIFICATIONS", content: { items: data.certifications },     order: 6 },
        { type: "PROJECTS",       content: { items: data.projects },           order: 7 },
      ]

      if (!dbResumeId) {
        const res = await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: data.title, languageCode: data.language, templateId: data.template || "modern", targetCountry: data.targetCountry, sections }),
        })
        const created = await res.json()
        setDbResumeId(created.id)
        router.replace(`/dashboard/builder/${created.id}`)
      } else {
        await fetch(`/api/resumes/${dbResumeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: data.title, languageCode: data.language, templateId: data.template || "modern", targetCountry: data.targetCountry, sections }),
        })
      }
      setLastSaved(new Date())
    } catch {
      toast("Failed to save resume. Please try again.", "error")
    } finally {
      setIsSaving(false)
    }
  }, [data, dbResumeId, router, toast])

  useEffect(() => {
    if (!isMounted) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => { void save() }, 3000)
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [data, isMounted, save])

  // ── Photo upload ─────────────────────────────────────────────────────────────

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast("Photo must be under 5 MB", "error")
      e.target.value = ""
      return
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("Only JPG, PNG, or WEBP photos are supported", "error")
      e.target.value = ""
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      updateContact({ photoDataUrl: ev.target?.result as string })
      toast("Photo added", "success")
    }
    reader.readAsDataURL(file)
  }

  // ── PDF download ─────────────────────────────────────────────────────────────

  const handleDownloadPDF = async () => {
    const res = await fetch("/api/resumes/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeData: data, watermark: userRole !== "ADMIN" }),
    })
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${data.contact.firstName || "resume"}_${data.contact.lastName || ""}_Resume.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // ── Translate ─────────────────────────────────────────────────────────────

  const handleTranslate = async (targetLang: string) => {
    if (targetLang === "en" || !data.summary) {
      setData({ language: targetLang })
      toast("Language updated", "success")
      return
    }
    setIsTranslating(true)
    try {
      const translated = await translateContent(data.summary, targetLang)
      setData({ summary: translated, language: targetLang })
      toast("Summary translated. Experience bullets can be rewritten in the builder.", "success")
    } catch {
      setData({ language: targetLang })
      toast("Language updated (translation failed — try AI rewrite in sections)", "info")
    } finally {
      setIsTranslating(false)
    }
  }

  if (!isMounted) return null

  const navSections: Section[] = ["contact", "summary", "experience", "education", "skills", "projects", "certifications", "languages", "portfolio"]

  const sectionIcons: Record<Section, React.ReactNode> = {
    contact: <User className="h-5 w-5" />, summary: <FileText className="h-5 w-5" />,
    experience: <Briefcase className="h-5 w-5" />, education: <GraduationCap className="h-5 w-5" />,
    skills: <Code className="h-5 w-5" />, projects: <FolderOpen className="h-5 w-5" />,
    certifications: <CheckSquare className="h-5 w-5" />, languages: <Globe className="h-5 w-5" />,
    portfolio: <BookOpen className="h-5 w-5" />,
  }

  const showPhotoUpload = PHOTO_TEMPLATES.has(data.template)

  return (
    <div className="flex h-screen flex-col bg-slate-100 overflow-hidden">
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
          {[
            { id: "sections" as const, icon: <User className="h-5 w-5" />, label: "Edit" },
            { id: "design"   as const, icon: <Palette className="h-5 w-5" />, label: "Design" },
            { id: "ai"       as const, icon: <Sparkles className="h-5 w-5" />, label: "AI" },
          ].map((tab) => (
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
                  photoInputRef={photoInputRef}
                  onPhotoUpload={handlePhotoUpload}
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
                          className={`border rounded-lg p-2 text-center text-xs cursor-pointer capitalize transition-colors ${data.template === t ? "border-blue-600 bg-blue-50 text-blue-600 font-medium" : "hover:bg-slate-50 text-slate-600"}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  {showPhotoUpload && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1">
                        <Camera className="h-3 w-3" />Photo
                      </Label>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 mb-2 flex gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        Photos may reduce ATS compatibility in US/UK/Canada.
                      </div>
                      <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => photoInputRef.current?.click()}>
                        <Camera className="h-3.5 w-3.5 mr-1.5" />{data.contact.photoDataUrl ? "Change Photo" : "Upload Photo"}
                      </Button>
                      {data.contact.photoDataUrl && (
                        <Button size="sm" variant="outline" className="w-full text-xs text-red-600 hover:bg-red-50" onClick={() => updateContact({ photoDataUrl: undefined })}>
                          <X className="h-3.5 w-3.5 mr-1.5" />Remove Photo
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Language</Label>
                    <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm"
                      value={data.language}
                      onChange={(e) => void handleTranslate(e.target.value)}>
                      {[["en","English"],["de","German"],["fr","French"],["es","Spanish"],["pt","Portuguese"],["ja","Japanese"],["zh","Chinese"]].map(([v,l]) => (
                        <option key={v} value={v}>{l}{isTranslating && v === data.language ? " (translating…)" : ""}</option>
                      ))}
                    </select>
                    {isTranslating && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="h-3 w-3 animate-spin" />Translating summary…
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Target Country</Label>
                    <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm" value={data.targetCountry} onChange={(e) => setData({ targetCountry: e.target.value })}>
                      <option value="US">USA</option>
                      <option value="DE">Germany</option>
                      <option value="UK">United Kingdom</option>
                      <option value="FR">France</option>
                      <option value="JP">Japan</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Font Size</Label>
                    <div className="flex gap-1.5">
                      {["Small", "Normal", "Large"].map((s) => (
                        <button key={s} className="flex-1 border rounded-lg py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:border-blue-300 transition-colors">{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Spacing</Label>
                    <div className="flex gap-1.5">
                      {["Compact", "Normal", "Spacious"].map((s) => (
                        <button key={s} className="flex-1 border rounded-lg py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:border-blue-300 transition-colors">{s}</button>
                      ))}
                    </div>
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
                  onSwitchSection={(s) => { setLeftTab("sections"); setActiveSection(s) }}
                />
              </ScrollArea>
            </>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 bg-slate-200 overflow-y-auto p-8 flex justify-center print:p-0 print:bg-white">
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.2s ease" }}>
            <ResumePreview data={data} />
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
  onSwitchSection: (s: Section) => void
}

function AICoachPanel({ data, setData, updateExperience, atsJobDesc, setAtsJobDesc, atsResult, setAtsResult, atsLoading, setAtsLoading, onToast, onSwitchSection }: AICoachPanelProps) {
  const [genLoading, setGenLoading] = useState(false)
  const [rewriteId, setRewriteId] = useState<string | null>(null)

  const missingItems: { label: string; section: Section; fix: string }[] = []
  if (!data.contact.email) missingItems.push({ label: "Email address", section: "contact", fix: "Add email" })
  if (!data.contact.phone) missingItems.push({ label: "Phone number", section: "contact", fix: "Add phone" })
  if (!data.contact.linkedin) missingItems.push({ label: "LinkedIn URL", section: "contact", fix: "Add LinkedIn" })
  if (!data.summary.trim()) missingItems.push({ label: "Professional summary", section: "summary", fix: "Write summary" })
  if (data.experience.length === 0) missingItems.push({ label: "Work experience", section: "experience", fix: "Add experience" })
  if (data.education.length === 0) missingItems.push({ label: "Education", section: "education", fix: "Add education" })
  if (data.skills.length === 0) missingItems.push({ label: "Skills", section: "skills", fix: "Add skills" })

  const handleGenerateSummary = async () => {
    setGenLoading(true)
    try {
      const jobTitle = data.experience[0]?.position || "Professional"
      const expText = data.experience.map((e) => `${e.position} at ${e.company}: ${e.description}`).join("\n")
      const result = await generateSummary(jobTitle, expText, data.language)
      setData({ summary: result })
      onToast("Summary generated", "success")
      onSwitchSection("summary")
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Generation failed", "error")
    } finally {
      setGenLoading(false)
    }
  }

  const handleRewriteFirst = async () => {
    const exp = data.experience[0]
    if (!exp) { onToast("Add work experience first", "info"); return }
    setRewriteId(exp.id)
    try {
      const result = await rewriteBullet(exp.description, exp.position, data.language)
      updateExperience(exp.id, { description: result })
      onToast("Bullet rewritten", "success")
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Rewrite failed", "error")
    } finally {
      setRewriteId(null)
    }
  }

  const handleATS = async () => {
    if (!atsJobDesc.trim()) return
    setAtsLoading(true); setAtsResult(null)
    try {
      const resumeText = [
        `${data.contact.firstName} ${data.contact.lastName}`,
        data.summary,
        ...data.experience.map((e) => `${e.position} at ${e.company}: ${e.description}`),
        ...data.skills.map((s) => s.name),
      ].join("\n")
      setAtsResult(await optimizeForATS(resumeText, atsJobDesc))
    } catch {
      setAtsResult({ score: 0, suggestions: ["Analysis failed. Try again."] })
    } finally {
      setAtsLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Missing sections */}
      {missingItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Missing Sections</p>
          {missingItems.map((item) => (
            <button key={item.label}
              onClick={() => onSwitchSection(item.section)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 transition-all text-left">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-800">{item.fix}</p>
                  <p className="text-[11px] text-red-600">{item.label} missing</p>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-red-400" />
            </button>
          ))}
        </div>
      )}

      {/* AI actions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-slate-500">AI Tools</p>
        <button onClick={() => void handleGenerateSummary()}
          disabled={genLoading}
          className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-200 hover:bg-violet-50/30 transition-all text-left">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-violet-600 bg-violet-50">
            {genLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          </div>
          <div><p className="text-sm font-semibold text-slate-800">Generate Summary</p><p className="text-xs text-slate-500">Write a professional summary using your experience</p></div>
        </button>

        <button onClick={() => void handleRewriteFirst()}
          disabled={rewriteId !== null}
          className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-blue-600 bg-blue-50">
            {rewriteId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </div>
          <div><p className="text-sm font-semibold text-slate-800">Improve First Bullet</p><p className="text-xs text-slate-500">Make your top experience bullet more impactful</p></div>
        </button>
      </div>

      {/* ATS optimizer */}
      <div className="border-t border-slate-100 pt-4 space-y-2">
        <Label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1">
          <Target className="h-3 w-3" />Job Match Score
        </Label>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
          placeholder="Paste job description to see keyword match score…"
          value={atsJobDesc}
          onChange={(e) => setAtsJobDesc(e.target.value)}
        />
        <Button size="sm" className="w-full text-xs bg-purple-600 hover:bg-purple-700"
          disabled={atsLoading || !atsJobDesc.trim()}
          onClick={() => void handleATS()}>
          {atsLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Target className="h-3 w-3 mr-1" />}Analyze Match
        </Button>
        {atsResult && (
          <div className="space-y-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Job Match Score</span>
              <span className={`text-sm font-bold ${atsResult.score >= 80 ? "text-emerald-600" : atsResult.score >= 60 ? "text-amber-600" : "text-red-600"}`}>{atsResult.score}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${atsResult.score >= 80 ? "bg-emerald-500" : atsResult.score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${atsResult.score}%` }} />
            </div>
            <ul className="space-y-1.5">
              {atsResult.suggestions.map((s, i) => (
                <li key={i} className="text-xs text-slate-600 flex gap-1.5 p-2 bg-slate-50 rounded-lg">
                  <span className="text-amber-500 shrink-0">•</span>{s}
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
  photoInputRef: React.RefObject<HTMLInputElement | null>
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function SectionEditor({ section, data, updateContact, setData, addExperience, updateExperience, removeExperience, onToast, showPhotoUpload, photoInputRef, onPhotoUpload }: SectionEditorProps) {
  const [aiLoading, setAiLoading] = useState<string | null>(null)

  const handleGenerateSummary = async () => {
    setAiLoading("summary")
    try {
      const jobTitle = data.experience[0]?.position || "Professional"
      const experienceText = data.experience.map((e) => `${e.position} at ${e.company}: ${e.description}`).join("\n")
      const result = await generateSummary(jobTitle, experienceText, data.language)
      setData({ summary: result })
      onToast("Summary generated", "success")
    } catch (e) {
      onToast(e instanceof Error ? e.message : "AI generation failed", "error")
    } finally {
      setAiLoading(null)
    }
  }

  const handleRewriteBullet = async (expId: string, description: string, position: string) => {
    setAiLoading(expId)
    try {
      const result = await rewriteBullet(description, position, data.language)
      updateExperience(expId, { description: result })
      onToast("Bullet rewritten", "success")
    } catch (e) {
      onToast(e instanceof Error ? e.message : "AI rewrite failed", "error")
    } finally {
      setAiLoading(null)
    }
  }

  if (section === "contact") {
    return (
      <div className="space-y-4">
        {showPhotoUpload && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase">Profile Photo</Label>
            <div className="flex items-center gap-3">
              {data.contact.photoDataUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.contact.photoDataUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover border-2 border-slate-200" />
                  <button onClick={() => updateContact({ photoDataUrl: undefined })}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                  <Camera className="h-6 w-6 text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoUpload} />
                <Button size="sm" variant="outline" className="text-xs" onClick={() => photoInputRef.current?.click()}>
                  {data.contact.photoDataUrl ? "Change" : "Upload Photo"}
                </Button>
                <p className="text-[10px] text-slate-400 mt-1">JPG, PNG · Recommended for {data.template} template</p>
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
        <div className="space-y-1.5"><Label>LinkedIn</Label><Input value={data.contact.linkedin} onChange={(e) => updateContact({ linkedin: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Website / Portfolio</Label><Input value={data.contact.website} onChange={(e) => updateContact({ website: e.target.value })} /></div>
      </div>
    )
  }

  if (section === "summary") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Professional Summary</Label>
          <Button size="sm" variant="outline" onClick={() => void handleGenerateSummary()} disabled={aiLoading === "summary"} className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
            {aiLoading === "summary" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}Generate with AI
          </Button>
        </div>
        <textarea
          className="flex min-h-[150px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
          value={data.summary}
          onChange={(e) => setData({ summary: e.target.value })}
          placeholder="Write a compelling 3-4 sentence summary…" />
        <p className="text-xs text-slate-400">{data.summary.trim().split(/\s+/).filter(Boolean).length} words · aim for 30–80</p>
      </div>
    )
  }

  if (section === "experience") {
    return (
      <div className="space-y-4">
        <Button className="w-full" variant="outline" onClick={() => addExperience({ id: crypto.randomUUID(), company: "", position: "", startDate: "", endDate: "", current: false, description: "" })}>
          <Plus className="h-4 w-4 mr-2" />Add Experience
        </Button>
        {data.experience.map((exp) => (
          <div key={exp.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 truncate pr-2">{exp.company || "New Experience"}</span>
              <button onClick={() => removeExperience(exp.id)} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1.5"><Label>Company</Label><Input value={exp.company} onChange={(e) => updateExperience(exp.id, { company: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Job Title</Label><Input value={exp.position} onChange={(e) => updateExperience(exp.id, { position: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start</Label><Input type="month" value={exp.startDate} onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>End</Label><Input type="month" value={exp.endDate} disabled={exp.current} onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={exp.current} onChange={(e) => updateExperience(exp.id, { current: e.target.checked })} />Currently working here
            </label>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Achievements</Label>
                <Button size="sm" variant="outline" onClick={() => void handleRewriteBullet(exp.id, exp.description, exp.position)} disabled={aiLoading === exp.id || !exp.description.trim()} className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
                  {aiLoading === exp.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}AI Rewrite
                </Button>
              </div>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                value={exp.description}
                onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                placeholder="• Led a team of 5 engineers…&#10;• Reduced latency by 40%…" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (section === "education") {
    return (
      <div className="space-y-4">
        <Button className="w-full" variant="outline" onClick={() => setData({ education: [...data.education, { id: crypto.randomUUID(), institution: "", degree: "", field: "", startDate: "", endDate: "" }] })}>
          <Plus className="h-4 w-4 mr-2" />Add Education
        </Button>
        {data.education.map((edu: Education, i: number) => (
          <div key={edu.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 truncate pr-2">{edu.institution || "New Education"}</span>
              <button onClick={() => setData({ education: data.education.filter((_: Education, idx: number) => idx !== i) })} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1.5"><Label>Institution</Label><Input value={edu.institution} onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], institution: e.target.value }; setData({ education: u }) }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Degree</Label><Input value={edu.degree} onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], degree: e.target.value }; setData({ education: u }) }} /></div>
              <div className="space-y-1.5"><Label>Field</Label><Input value={edu.field} onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], field: e.target.value }; setData({ education: u }) }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start</Label><Input type="month" value={edu.startDate} onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], startDate: e.target.value }; setData({ education: u }) }} /></div>
              <div className="space-y-1.5"><Label>End</Label><Input type="month" value={edu.endDate} onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], endDate: e.target.value }; setData({ education: u }) }} /></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (section === "skills") {
    return (
      <div className="space-y-4">
        <Button className="w-full" variant="outline" onClick={() => setData({ skills: [...data.skills, { id: crypto.randomUUID(), name: "", level: "Intermediate" }] })}>
          <Plus className="h-4 w-4 mr-2" />Add Skill
        </Button>
        {data.skills.map((skill: Skill, i: number) => (
          <div key={skill.id} className="flex gap-2 items-center">
            <Input placeholder="Skill" value={skill.name} onChange={(e) => { const u = [...data.skills]; u[i] = { ...u[i], name: e.target.value }; setData({ skills: u }) }} className="flex-1" />
            <select className="h-9 rounded-md border border-slate-200 bg-transparent px-2 py-1 text-sm" value={skill.level} onChange={(e) => { const u = [...data.skills]; u[i] = { ...u[i], level: e.target.value }; setData({ skills: u }) }}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Expert</option>
            </select>
            <button onClick={() => setData({ skills: data.skills.filter((_: Skill, idx: number) => idx !== i) })} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    )
  }

  if (section === "projects") {
    return (
      <div className="space-y-4">
        <Button className="w-full" variant="outline" onClick={() => setData({ projects: [...data.projects, { id: crypto.randomUUID(), name: "", description: "", url: "", startDate: "", endDate: "" }] })}>
          <Plus className="h-4 w-4 mr-2" />Add Project
        </Button>
        {data.projects.map((proj: Project, i: number) => (
          <div key={proj.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 truncate pr-2">{proj.name || "New Project"}</span>
              <button onClick={() => setData({ projects: data.projects.filter((_: Project, idx: number) => idx !== i) })} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1.5"><Label>Project Name</Label><Input value={proj.name} onChange={(e) => { const u = [...data.projects]; u[i] = { ...u[i], name: e.target.value }; setData({ projects: u }) }} /></div>
            <div className="space-y-1.5"><Label>URL</Label><Input value={proj.url} placeholder="https://github.com/..." onChange={(e) => { const u = [...data.projects]; u[i] = { ...u[i], url: e.target.value }; setData({ projects: u }) }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start</Label><Input type="month" value={proj.startDate} onChange={(e) => { const u = [...data.projects]; u[i] = { ...u[i], startDate: e.target.value }; setData({ projects: u }) }} /></div>
              <div className="space-y-1.5"><Label>End</Label><Input type="month" value={proj.endDate} onChange={(e) => { const u = [...data.projects]; u[i] = { ...u[i], endDate: e.target.value }; setData({ projects: u }) }} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                value={proj.description}
                onChange={(e) => { const u = [...data.projects]; u[i] = { ...u[i], description: e.target.value }; setData({ projects: u }) }}
                placeholder="Built a tool that..." />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (section === "certifications") {
    return (
      <div className="space-y-4">
        <Button className="w-full" variant="outline" onClick={() => setData({ certifications: [...data.certifications, { id: crypto.randomUUID(), name: "", issuer: "", date: "", url: "" }] })}>
          <Plus className="h-4 w-4 mr-2" />Add Certification
        </Button>
        {data.certifications.map((cert: Certification, i: number) => (
          <div key={cert.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 truncate pr-2">{cert.name || "New Certification"}</span>
              <button onClick={() => setData({ certifications: data.certifications.filter((_: Certification, idx: number) => idx !== i) })} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1.5"><Label>Certification Name</Label><Input value={cert.name} onChange={(e) => { const u = [...data.certifications]; u[i] = { ...u[i], name: e.target.value }; setData({ certifications: u }) }} /></div>
            <div className="space-y-1.5"><Label>Issuing Organization</Label><Input value={cert.issuer} onChange={(e) => { const u = [...data.certifications]; u[i] = { ...u[i], issuer: e.target.value }; setData({ certifications: u }) }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Date</Label><Input type="month" value={cert.date} onChange={(e) => { const u = [...data.certifications]; u[i] = { ...u[i], date: e.target.value }; setData({ certifications: u }) }} /></div>
              <div className="space-y-1.5"><Label>URL</Label><Input value={cert.url} placeholder="https://..." onChange={(e) => { const u = [...data.certifications]; u[i] = { ...u[i], url: e.target.value }; setData({ certifications: u }) }} /></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

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
              <option>Native</option>
              <option>Fluent</option>
              <option>Professional</option>
              <option>Conversational</option>
              <option>Basic</option>
            </select>
            <button onClick={() => setData({ languages: data.languages.filter((_: Lang, idx: number) => idx !== i) })} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm text-center">
      <p>This section is coming soon.</p>
    </div>
  )
}

// ─── Resume Preview (multi-template renderer) ─────────────────────────────────

function fmt(dateStr: string, lang: string): string {
  if (!dateStr) return ""
  try {
    const d = new Date(`${dateStr}-01`)
    return d.toLocaleDateString(lang === "ja" ? "ja-JP" : lang === "de" ? "de-DE" : lang === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "short" })
  } catch { return dateStr }
}

function ResumePreview({ data }: { data: ResumeData }) {
  const lang  = data.language || "en"
  const tmpl  = data.template || "modern"
  const photo = data.contact.photoDataUrl

  if (tmpl === "minimal" || tmpl === "ats-friendly") return <MinimalTemplate data={data} lang={lang} />
  if (tmpl === "classic") return <ClassicTemplate data={data} lang={lang} />
  if (tmpl === "executive") return <ExecutiveTemplate data={data} lang={lang} />
  if (SIDEBAR_TEMPLATES.has(tmpl)) return <SidebarTemplate data={data} lang={lang} photo={photo} />
  if (tmpl === "german" || tmpl === "japanese") return <PhotoHeaderTemplate data={data} lang={lang} photo={photo} />
  return <ModernTemplate data={data} lang={lang} />
}

// ── Shared styles ──

const PAGE = "bg-white shadow-xl w-[210mm] min-h-[297mm] print:shadow-none print:min-h-0"
const RULE  = "border-b border-slate-200 mb-2 pb-1"

function SectionHead({ title, accent = "#3B82F6" }: { title: string; accent?: string }) {
  return (
    <div className={RULE}>
      <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>{title}</h2>
    </div>
  )
}

// ── Modern Template ──────────────────────────────────────────────────────────

function ModernTemplate({ data, lang }: { data: ResumeData; lang: string }) {
  const accent = "#3B82F6"
  const name = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()
  return (
    <div className={PAGE} style={{ padding: "18mm 20mm", fontSize: "10.5pt", lineHeight: "1.45", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
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

// ── Classic/ATS Template ─────────────────────────────────────────────────────

function ClassicTemplate({ data, lang }: { data: ResumeData; lang: string }) {
  const accent = "#1F2937"
  const name = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()
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

// ── Executive Template ───────────────────────────────────────────────────────

function ExecutiveTemplate({ data, lang }: { data: ResumeData; lang: string }) {
  const accent  = "#D97706"
  const header  = "#0F172A"
  const name = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()
  return (
    <div className={PAGE} style={{ fontSize: "10.5pt", lineHeight: "1.45", fontFamily: "Georgia, serif" }}>
      {/* Dark header band */}
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

// ── Minimal Template ─────────────────────────────────────────────────────────

function MinimalTemplate({ data, lang }: { data: ResumeData; lang: string }) {
  const accent = "#334155"
  const name = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()
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

// ── Sidebar Template (modern, creative, french, global) ──────────────────────

function SidebarTemplate({ data, lang, photo }: { data: ResumeData; lang: string; photo?: string }) {
  const accent   = data.template === "creative" ? "#7C3AED" : data.template === "french" ? "#2563EB" : "#3B82F6"
  const sidebarBg = data.template === "creative" ? "#1e1b4b" : data.template === "french" ? "#1e3a8a" : "#1e3a5f"
  const name = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()

  return (
    <div className={`${PAGE} flex`} style={{ fontSize: "10pt", lineHeight: "1.45", fontFamily: "system-ui, sans-serif" }}>
      {/* Sidebar */}
      <div className="w-[38%] shrink-0 flex flex-col" style={{ backgroundColor: sidebarBg, padding: "16mm 10mm" }}>
        {/* Photo */}
        <div className="flex justify-center mb-4">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white/30" />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
              <User className="h-10 w-10 text-white/40" />
            </div>
          )}
        </div>
        <h1 className="text-lg font-bold text-white text-center leading-tight mb-1">{name}</h1>
        <div className="h-0.5 w-10 mx-auto mb-4" style={{ backgroundColor: accent }} />
        {/* Contact in sidebar */}
        <div className="space-y-2 text-xs text-white/70">
          {data.contact.email    && <div className="break-all">{data.contact.email}</div>}
          {data.contact.phone    && <div>{data.contact.phone}</div>}
          {(data.contact.city || data.contact.country) && <div>{[data.contact.city, data.contact.country].filter(Boolean).join(", ")}</div>}
          {data.contact.linkedin && <div className="break-all" style={{ color: "rgba(147,197,253,1)" }}>{data.contact.linkedin}</div>}
          {data.contact.website  && <div className="break-all" style={{ color: "rgba(147,197,253,1)" }}>{data.contact.website}</div>}
        </div>
        {/* Skills in sidebar */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col" style={{ padding: "16mm 14mm" }}>
        <ResumeBody data={data} lang={lang} accent={accent} skipSkills />
      </div>
    </div>
  )
}

// ── Photo Header Template (German, Japanese) ─────────────────────────────────

function PhotoHeaderTemplate({ data, lang, photo }: { data: ResumeData; lang: string; photo?: string }) {
  const isJapanese = data.template === "japanese"
  const accent = isJapanese ? "#DC2626" : "#DC2626"
  const name = `${data.contact.firstName || "First"} ${data.contact.lastName || "Last"}`.trim()
  const contact = [data.contact.email, data.contact.phone, [data.contact.city, data.contact.country].filter(Boolean).join(", "), data.contact.linkedin].filter(Boolean)

  return (
    <div className={PAGE} style={{ padding: "18mm 20mm", fontSize: "10.5pt", lineHeight: "1.5", fontFamily: isJapanese ? "system-ui, sans-serif" : "system-ui, sans-serif" }}>
      {/* Header row: name+contact left, photo right */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 pr-6">
          <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
          <div className="h-0.5 w-12 mt-2 mb-3" style={{ backgroundColor: accent }} />
          <div className="space-y-1">
            {contact.map((c, i) => <p key={i} className="text-xs text-slate-600">{c}</p>)}
          </div>
        </div>
        <div className="shrink-0">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Profile" className={`object-cover border-2 border-slate-200 ${isJapanese ? "w-24 h-32" : "w-24 h-24 rounded-full"}`} />
          ) : (
            <div className={`border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 bg-slate-50 ${isJapanese ? "w-24 h-32" : "w-24 h-24 rounded-full"}`}>
              <Camera className="h-6 w-6 text-slate-300" />
              <span className="text-[9px] text-slate-400 text-center px-1">Add Photo</span>
            </div>
          )}
        </div>
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
  function SHead({ title }: { title: string }) {
    if (headingStyle === "MINIMAL") {
      return <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-0.5 mb-2">{title}</h2>
    }
    if (headingStyle === "UPPERCASE") {
      return <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600 border-b border-slate-200 pb-1 mb-2">{title}</h2>
    }
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
                  <p className="text-xs text-slate-500 shrink-0 ml-2">
                    {fmt(exp.startDate, lang)}{exp.startDate ? " – " : ""}
                    {exp.current ? (lang === "de" ? "Heute" : lang === "fr" ? "Aujourd'hui" : lang === "ja" ? "現在" : "Present") : fmt(exp.endDate, lang)}
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
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {proj.name || "Project"}
                      {proj.url && <span className="font-normal text-xs ml-2" style={{ color: accent }}>{proj.url}</span>}
                    </p>
                  </div>
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
