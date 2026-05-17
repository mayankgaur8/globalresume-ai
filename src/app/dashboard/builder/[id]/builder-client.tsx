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
  Palette, Mail,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { generateSummary, rewriteBullet, optimizeForATS } from "@/actions/ai"
import { useToast, type ToastType } from "@/components/ui/toaster"

type Section = "contact" | "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "languages" | "portfolio"

type Experience = ResumeData["experience"][number]
type Education = ResumeData["education"][number]
type Skill = ResumeData["skills"][number]

const SECTION_LABELS: Record<Section, string> = {
  contact: "Contact",
  summary: "Summary",
  experience: "Work History",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  languages: "Languages",
  portfolio: "Portfolio",
}

interface Props {
  resumeId: string
  userId: string
  userRole: string
}

export function BuilderClient({ resumeId, userRole }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const { data, updateContact, setData, addExperience, updateExperience, removeExperience } = useResumeStore()
  const [activeSection, setActiveSection] = useState<Section>("contact")
  const [isMounted, setIsMounted] = useState(false) // set after first effect to avoid SSR mismatch
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [dbResumeId, setDbResumeId] = useState<string | null>(resumeId !== "new" ? resumeId : null)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [atsJobDesc, setAtsJobDesc] = useState("")
  const [atsResult, setAtsResult] = useState<{ score: number; suggestions: string[] } | null>(null)
  const [atsLoading, setAtsLoading] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [leftTab, setLeftTab] = useState<"sections" | "design" | "ai">("sections")

  useEffect(() => {
    setIsMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
    if (resumeId !== "new") {
      fetch(`/api/resumes/${resumeId}`)
        .then((r) => r.json())
        .then((resume) => {
          const contact = resume.sections?.find((s: { type: string }) => s.type === "CONTACT")?.content || {}
          const summary = resume.sections?.find((s: { type: string }) => s.type === "SUMMARY")?.content?.text || ""
          const experience = resume.sections?.find((s: { type: string }) => s.type === "EXPERIENCE")?.content?.items || []
          const education = resume.sections?.find((s: { type: string }) => s.type === "EDUCATION")?.content?.items || []
          const skills = resume.sections?.find((s: { type: string }) => s.type === "SKILLS")?.content?.items || []
          setData({ id: resume.id, title: resume.title, language: resume.languageCode, template: resume.templateId, targetCountry: resume.targetCountry || "US", contact, summary, experience, education, skills })
        })
        .catch(() => {})
    }
  }, [resumeId, setData])

  const save = useCallback(async () => {
    setIsSaving(true)
    try {
      const sections = [
        { type: "CONTACT", content: data.contact, order: 0 },
        { type: "SUMMARY", content: { text: data.summary }, order: 1 },
        { type: "EXPERIENCE", content: { items: data.experience }, order: 2 },
        { type: "EDUCATION", content: { items: data.education }, order: 3 },
        { type: "SKILLS", content: { items: data.skills }, order: 4 },
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
      toast("Resume saved successfully", "success")
    } catch {
      toast("Failed to save resume. Please try again.", "error")
    } finally {
      setIsSaving(false)
    }
  }, [data, dbResumeId, router, toast])

  useEffect(() => {
    if (!isMounted) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => { save() }, 3000)
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [data, isMounted, save])

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
      a.download = `${data.title || "resume"}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (!isMounted) return null

  const navSections: Section[] = ["contact", "summary", "experience", "education", "skills", "projects", "certifications", "languages", "portfolio"]

  const sectionIcons: Record<Section, React.ReactNode> = {
    contact: <User className="h-5 w-5" />,
    summary: <FileText className="h-5 w-5" />,
    experience: <Briefcase className="h-5 w-5" />,
    education: <GraduationCap className="h-5 w-5" />,
    skills: <Code className="h-5 w-5" />,
    projects: <FolderOpen className="h-5 w-5" />,
    certifications: <CheckSquare className="h-5 w-5" />,
    languages: <Globe className="h-5 w-5" />,
    portfolio: <BookOpen className="h-5 w-5" />,
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 overflow-hidden">
      {/* Top bar */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-3 shrink-0 print:hidden gap-2">
        {/* Left: back + name + save status */}
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Input
            value={data.title}
            onChange={(e) => setData({ title: e.target.value })}
            className="w-48 border-transparent hover:border-slate-200 focus-visible:ring-0 font-semibold px-2 h-8 text-sm"
          />
          <div className="flex items-center gap-1 shrink-0">
            {isSaving
              ? <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin" />
              : lastSaved
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                : null}
            {lastSaved && (
              <span className="text-xs text-slate-400 hidden md:block">
                {isSaving ? "Saving…" : `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </span>
            )}
          </div>
        </div>

        {/* Center: undo/redo + zoom */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" title="Undo" disabled>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" title="Redo" disabled>
            <Redo2 className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" title="Zoom out"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-mono text-slate-600 w-10 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" title="Zoom in"
            onClick={() => setZoom((z) => Math.min(150, z + 10))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hidden sm:flex" onClick={save} disabled={isSaving} title="Save">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hidden sm:flex" onClick={() => window.print()} title="Print">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hidden sm:flex" title="Email">
            <Mail className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" title="More options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs font-semibold" onClick={handleDownloadPDF}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Download
          </Button>
          <Link href="/dashboard/resumes">
            <Button className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3 text-xs font-semibold hidden md:flex">
              Finish
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left tab bar */}
        <div className="w-14 bg-slate-900 flex flex-col items-center py-3 gap-1 shrink-0 print:hidden">
          {/* Section tabs */}
          {[
            { id: "sections" as const, icon: <User className="h-5 w-5" />, label: "Edit" },
            { id: "design" as const, icon: <Palette className="h-5 w-5" />, label: "Design" },
            { id: "ai" as const, icon: <Sparkles className="h-5 w-5" />, label: "AI" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLeftTab(tab.id)}
              title={tab.label}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg w-11 text-[9px] font-medium transition-colors ${
                leftTab === tab.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}

          <div className="w-8 h-px bg-slate-700 my-1" />

          {/* Section shortcuts (only in sections tab) */}
          {leftTab === "sections" && navSections.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              title={SECTION_LABELS[s]}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg w-11 text-[8px] transition-colors ${
                activeSection === s ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500" : "text-slate-500 hover:bg-slate-700 hover:text-white"
              }`}
            >
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
                />
              </ScrollArea>
            </>
          )}

          {leftTab === "design" && (
            <>
              <div className="px-4 py-3 border-b bg-slate-50">
                <span className="font-semibold text-slate-800 text-sm">Design & Formatting</span>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Template</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["modern", "classic", "minimal", "executive"].map((t) => (
                        <button key={t} onClick={() => setData({ template: t })}
                          className={`border rounded-lg p-2 text-center text-xs cursor-pointer capitalize transition-colors ${
                            data.template === t ? "border-blue-600 bg-blue-50 text-blue-600 font-medium" : "hover:bg-slate-50 text-slate-600"
                          }`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Accent Color</Label>
                    <div className="flex gap-2">
                      {["#3B82F6", "#7C3AED", "#059669", "#DC2626", "#D97706", "#111827"].map((color) => (
                        <button key={color} className="h-7 w-7 rounded-full border-2 border-white ring-2 ring-slate-200 hover:ring-slate-400 transition-all" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Font</Label>
                    <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm">
                      <option>Inter (Modern)</option>
                      <option>Georgia (Classic)</option>
                      <option>Helvetica (Clean)</option>
                      <option>Times New Roman (Traditional)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Spacing</Label>
                    <div className="flex gap-1.5">
                      {["Compact", "Normal", "Spacious"].map((s) => (
                        <button key={s} className="flex-1 border rounded-lg py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:border-blue-300 transition-colors">{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Language</Label>
                    <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm" value={data.language} onChange={(e) => setData({ language: e.target.value })}>
                      <option value="en">English</option>
                      <option value="de">German</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                      <option value="pt">Portuguese</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Target Country</Label>
                    <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm" value={data.targetCountry} onChange={(e) => setData({ targetCountry: e.target.value })}>
                      <option value="US">USA</option>
                      <option value="DE">Germany</option>
                      <option value="UK">United Kingdom</option>
                      <option value="FR">France</option>
                      <option value="JP">Japan</option>
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
                  <Sparkles className="h-4 w-4 text-violet-600" />AI Assistant
                </span>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">AI tools to supercharge your resume</p>
                  {[
                    { label: "Generate Summary", desc: "Write a professional summary", icon: <FileText className="h-4 w-4" />, color: "text-violet-600 bg-violet-50" },
                    { label: "Improve Bullets", desc: "Make bullets more impactful", icon: <Sparkles className="h-4 w-4" />, color: "text-blue-600 bg-blue-50" },
                    { label: "ATS Optimize", desc: "Match job description keywords", icon: <Target className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Translate Resume", desc: "Translate to another language", icon: <Globe className="h-4 w-4" />, color: "text-amber-600 bg-amber-50" },
                  ].map((action) => (
                    <button key={action.label} onClick={() => { setLeftTab("sections"); setActiveSection(action.label.includes("Summary") ? "summary" : "experience") }}
                      className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
                        {action.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                        <p className="text-xs text-slate-500">{action.desc}</p>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1">
                      <Target className="h-3 w-3" />ATS Score
                    </Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                      placeholder="Paste job description..."
                      value={atsJobDesc}
                      onChange={(e) => setAtsJobDesc(e.target.value)}
                    />
                    <Button size="sm" className="w-full text-xs bg-purple-600 hover:bg-purple-700" disabled={atsLoading || !atsJobDesc.trim()}
                      onClick={async () => {
                        setAtsLoading(true); setAtsResult(null)
                        try {
                          const resumeText = [`${data.contact.firstName} ${data.contact.lastName}`, data.summary, ...data.experience.map((e) => `${e.position} at ${e.company}: ${e.description}`), ...data.skills.map((s) => s.name)].join("\n")
                          setAtsResult(await optimizeForATS(resumeText, atsJobDesc))
                        } catch { setAtsResult({ score: 0, suggestions: ["Analysis failed. Try again."] }) }
                        finally { setAtsLoading(false) }
                      }}>
                      {atsLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Target className="h-3 w-3 mr-1" />}Analyze
                    </Button>
                    {atsResult && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">ATS Score</span>
                          <span className={`text-sm font-bold ${atsResult.score >= 80 ? "text-emerald-600" : atsResult.score >= 60 ? "text-amber-600" : "text-red-600"}`}>{atsResult.score}/100</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${atsResult.score >= 80 ? "bg-emerald-500" : atsResult.score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${atsResult.score}%` }} />
                        </div>
                        <ul className="space-y-1">
                          {atsResult.suggestions.map((s, i) => (
                            <li key={i} className="text-xs text-slate-600 flex gap-1.5"><span className="text-amber-500 shrink-0">•</span>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
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

// ─── Section Editor ───────────────────────────────────────────────────────────

interface SectionEditorProps {
  section: Section
  data: ResumeData
  updateContact: (c: Partial<ResumeData["contact"]>) => void
  setData: (d: Partial<ResumeData>) => void
  addExperience: (e: Experience) => void
  updateExperience: (id: string, e: Partial<Experience>) => void
  removeExperience: (id: string) => void
  onToast: (message: string, type?: ToastType, title?: string) => void
}

function SectionEditor({ section, data, updateContact, setData, addExperience, updateExperience, removeExperience, onToast }: SectionEditorProps) {
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>First Name</Label>
            <Input value={data.contact.firstName} onChange={(e) => updateContact({ firstName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Last Name</Label>
            <Input value={data.contact.lastName} onChange={(e) => updateContact({ lastName: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={data.contact.email} onChange={(e) => updateContact({ email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={data.contact.phone} onChange={(e) => updateContact({ phone: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={data.contact.city} onChange={(e) => updateContact({ city: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input value={data.contact.country} onChange={(e) => updateContact({ country: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>LinkedIn</Label>
          <Input value={data.contact.linkedin} onChange={(e) => updateContact({ linkedin: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Website / Portfolio</Label>
          <Input value={data.contact.website} onChange={(e) => updateContact({ website: e.target.value })} />
        </div>
      </div>
    )
  }

  if (section === "summary") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Professional Summary</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateSummary}
            disabled={aiLoading === "summary"}
            className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            {aiLoading === "summary" ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            Generate with AI
          </Button>
        </div>
        <textarea
          className="flex min-h-[150px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
          value={data.summary}
          onChange={(e) => setData({ summary: e.target.value })}
          placeholder="Write a compelling 3-4 sentence summary..."
        />
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
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={exp.company} onChange={(e) => updateExperience(exp.id, { company: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Job Title</Label>
              <Input value={exp.position} onChange={(e) => updateExperience(exp.id, { position: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input type="month" value={exp.startDate} onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input type="month" value={exp.endDate} disabled={exp.current} onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={exp.current} onChange={(e) => updateExperience(exp.id, { current: e.target.checked })} />
              Currently working here
            </label>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Achievements</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRewriteBullet(exp.id, exp.description, exp.position)}
                  disabled={aiLoading === exp.id || !exp.description.trim()}
                  className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  {aiLoading === exp.id ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  AI Rewrite
                </Button>
              </div>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                value={exp.description}
                onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                placeholder="• Led a team of 5 engineers..."
              />
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
            <div className="space-y-1.5">
              <Label>Institution</Label>
              <Input value={edu.institution} onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], institution: e.target.value }; setData({ education: u }) }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Degree</Label>
                <Input value={edu.degree} onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], degree: e.target.value }; setData({ education: u }) }} />
              </div>
              <div className="space-y-1.5">
                <Label>Field</Label>
                <Input value={edu.field} onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], field: e.target.value }; setData({ education: u }) }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input type="month" value={edu.startDate} onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], startDate: e.target.value }; setData({ education: u }) }} />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input type="month" value={edu.endDate} onChange={(e) => { const u = [...data.education]; u[i] = { ...u[i], endDate: e.target.value }; setData({ education: u }) }} />
              </div>
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
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Expert</option>
            </select>
            <button onClick={() => setData({ skills: data.skills.filter((_: Skill, idx: number) => idx !== i) })} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></button>
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

// ─── Resume Preview ───────────────────────────────────────────────────────────

function ResumePreview({ data }: { data: ResumeData }) {
  const isModern = data.template === "modern" || !data.template
  const isMinimal = data.template === "minimal"

  return (
    <div className="bg-white shadow-xl w-[210mm] min-h-[297mm] print:shadow-none print:min-h-0" style={{ padding: "20mm", fontSize: "11pt", lineHeight: "1.4" }}>
      <div className={`mb-6 ${isModern ? "text-center" : "text-left"}`}>
        <h1 className={`font-bold text-slate-800 ${isMinimal ? "text-2xl" : "text-3xl uppercase tracking-wider"}`}>
          {data.contact.firstName || "First"} {data.contact.lastName || "Last"}
        </h1>
        <div className={`flex flex-wrap gap-x-3 gap-y-1 text-sm mt-2 text-slate-500 ${isModern ? "justify-center" : ""}`}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <><span>•</span><span>{data.contact.phone}</span></>}
          {data.contact.city && <><span>•</span><span>{data.contact.city}{data.contact.country ? `, ${data.contact.country}` : ""}</span></>}
          {data.contact.linkedin && <><span>•</span><span className="text-blue-600">{data.contact.linkedin}</span></>}
        </div>
        {isModern && <div className="h-1 w-16 bg-blue-600 mx-auto mt-3 rounded" />}
      </div>

      {data.summary && (
        <section className="mb-5">
          <h2 className={`font-bold text-slate-800 mb-2 ${isMinimal ? "text-sm uppercase text-slate-500" : "text-sm uppercase tracking-wider border-b border-slate-300 pb-1"}`}>
            {isMinimal ? "About" : "Professional Summary"}
          </h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider border-b border-slate-300 pb-1">Work Experience</h2>
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{exp.position || "Position"}</p>
                    <p className="text-blue-600 text-sm">{exp.company || "Company"}</p>
                  </div>
                  <p className="text-xs text-slate-500 shrink-0">
                    {exp.startDate && new Date(exp.startDate).toLocaleDateString("en", { year: "numeric", month: "short" })}
                    {exp.startDate && " – "}
                    {exp.current ? "Present" : exp.endDate && new Date(exp.endDate).toLocaleDateString("en", { year: "numeric", month: "short" })}
                  </p>
                </div>
                {exp.description && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{exp.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education.length > 0 && (
        <section className="mb-5">
          <h2 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider border-b border-slate-300 pb-1">Education</h2>
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{edu.degree}{edu.field && ` in ${edu.field}`}</p>
                  <p className="text-sm text-blue-600">{edu.institution}</p>
                </div>
                <p className="text-xs text-slate-500 shrink-0">
                  {edu.startDate && new Date(edu.startDate).toLocaleDateString("en", { year: "numeric", month: "short" })}
                  {edu.endDate && ` – ${new Date(edu.endDate).toLocaleDateString("en", { year: "numeric", month: "short" })}`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="mb-5">
          <h2 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider border-b border-slate-300 pb-1">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span key={skill.id} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                {skill.name}{skill.level !== "Intermediate" && <span className="text-slate-400 ml-1">· {skill.level}</span>}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
