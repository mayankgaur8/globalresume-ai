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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { generateSummary, rewriteBullet, optimizeForATS } from "@/actions/ai"

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
    } finally {
      setIsSaving(false)
    }
  }, [data, dbResumeId, router])

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
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <Input
            value={data.title}
            onChange={(e) => setData({ title: e.target.value })}
            className="w-64 border-transparent hover:border-slate-200 focus-visible:ring-0 text-lg font-semibold px-2"
          />
          {lastSaved && <span className="text-xs text-slate-400 hidden sm:block">Saved {lastSaved.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={save} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />Download PDF
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Icon nav column */}
        <div className="w-16 bg-slate-800 flex flex-col items-center py-4 gap-1 shrink-0 print:hidden">
          {navSections.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              title={SECTION_LABELS[s]}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg w-12 text-[9px] transition-colors ${
                activeSection === s ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {sectionIcons[s]}
              <span className="truncate w-full text-center leading-tight">{SECTION_LABELS[s].split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Editor panel */}
        <div className="w-[360px] bg-white border-r flex flex-col shrink-0 z-10 shadow-lg print:hidden">
          <div className="p-4 border-b font-semibold text-slate-900">{SECTION_LABELS[activeSection]}</div>
          <ScrollArea className="flex-1 p-5">
            <SectionEditor
              section={activeSection}
              data={data}
              updateContact={updateContact}
              setData={setData}
              addExperience={addExperience}
              updateExperience={updateExperience}
              removeExperience={removeExperience}
            />
          </ScrollArea>
        </div>

        {/* Preview */}
        <div className="flex-1 bg-slate-200 overflow-y-auto p-8 flex justify-center print:p-0 print:bg-white">
          <ResumePreview data={data} />
        </div>

        {/* Settings panel */}
        <div className="w-[240px] bg-white border-l flex flex-col shrink-0 print:hidden">
          <div className="p-4 border-b font-semibold text-slate-900 text-sm">Design & Settings</div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-slate-500">Template</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["modern", "classic", "minimal", "executive"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setData({ template: t })}
                      className={`border rounded-lg p-2 text-center text-xs cursor-pointer capitalize transition-colors ${
                        data.template === t ? "border-blue-600 bg-blue-50 text-blue-600 font-medium" : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-slate-500">Language</Label>
                <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm" value={data.language} onChange={(e) => setData({ language: e.target.value })}>
                  <option value="en">English</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="pt">Portuguese</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-slate-500">Target Country</Label>
                <select className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm" value={data.targetCountry} onChange={(e) => setData({ targetCountry: e.target.value })}>
                  <option value="US">USA</option>
                  <option value="DE">Germany</option>
                  <option value="UK">United Kingdom</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                  <option value="ES">Spain</option>
                  <option value="PT">Portugal</option>
                  <option value="BR">Brazil</option>
                </select>
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <Label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1">
                  <Target className="h-3 w-3" />ATS Score
                </Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  placeholder="Paste job description..."
                  value={atsJobDesc}
                  onChange={(e) => setAtsJobDesc(e.target.value)}
                />
                <Button
                  size="sm"
                  className="w-full text-xs bg-purple-600 hover:bg-purple-700"
                  disabled={atsLoading || !atsJobDesc.trim()}
                  onClick={async () => {
                    setAtsLoading(true)
                    setAtsResult(null)
                    try {
                      const resumeText = [
                        `${data.contact.firstName} ${data.contact.lastName}`,
                        data.summary,
                        ...data.experience.map((e) => `${e.position} at ${e.company}: ${e.description}`),
                        ...data.skills.map((s) => s.name),
                      ].join("\n")
                      const result = await optimizeForATS(resumeText, atsJobDesc)
                      setAtsResult(result)
                    } catch {
                      setAtsResult({ score: 0, suggestions: ["Analysis failed. Try again."] })
                    } finally {
                      setAtsLoading(false)
                    }
                  }}
                >
                  {atsLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Target className="h-3 w-3 mr-1" />}
                  Analyze
                </Button>
                {atsResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">ATS Score</span>
                      <span className={`text-sm font-bold ${atsResult.score >= 80 ? "text-emerald-600" : atsResult.score >= 60 ? "text-amber-600" : "text-red-600"}`}>
                        {atsResult.score}/100
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${atsResult.score >= 80 ? "bg-emerald-500" : atsResult.score >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${atsResult.score}%` }}
                      />
                    </div>
                    <ul className="space-y-1">
                      {atsResult.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                          <span className="text-amber-500 shrink-0">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
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
}

function SectionEditor({ section, data, updateContact, setData, addExperience, updateExperience, removeExperience }: SectionEditorProps) {
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const handleGenerateSummary = async () => {
    setAiLoading("summary")
    setAiError(null)
    try {
      const jobTitle = data.experience[0]?.position || "Professional"
      const experienceText = data.experience.map((e) => `${e.position} at ${e.company}: ${e.description}`).join("\n")
      const result = await generateSummary(jobTitle, experienceText, data.language)
      setData({ summary: result })
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI generation failed")
    } finally {
      setAiLoading(null)
    }
  }

  const handleRewriteBullet = async (expId: string, description: string, position: string) => {
    setAiLoading(expId)
    setAiError(null)
    try {
      const result = await rewriteBullet(description, position, data.language)
      updateExperience(expId, { description: result })
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI rewrite failed")
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
        {aiError && <p className="text-xs text-red-500">{aiError}</p>}
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
              {aiError && aiLoading === null && <p className="text-xs text-red-500">{aiError}</p>}
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
