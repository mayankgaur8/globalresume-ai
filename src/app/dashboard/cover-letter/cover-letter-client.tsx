"use client"

import { useState } from "react"
import { Sparkles, Download, Loader2, Mail, Building2, Briefcase, ChevronDown, Copy, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"

const TONES = [
  { id: "professional", label: "Professional", desc: "Formal and polished" },
  { id: "confident", label: "Confident", desc: "Bold and assertive" },
  { id: "concise", label: "Concise", desc: "Brief and to the point" },
  { id: "executive", label: "Executive", desc: "Senior leadership tone" },
  { id: "international", label: "International", desc: "Cross-cultural style" },
]

const SAMPLE_LETTER = `Dear Hiring Manager,

I am writing to express my strong interest in the Senior Software Engineer position at TechCorp Berlin. With over 5 years of experience building scalable web applications using React, TypeScript, and Node.js, I am confident in my ability to contribute meaningfully to your team.

In my current role at StartupXYZ, I led the development of a real-time collaboration platform that scaled to 50,000 concurrent users, reducing load times by 40%. I have a proven track record of delivering high-quality code, mentoring junior engineers, and collaborating cross-functionally with product and design teams.

What excites me most about TechCorp Berlin is your commitment to developer experience and your innovative approach to building developer tools. I would be thrilled to bring my expertise in distributed systems and modern frontend architecture to help push your platform forward.

I look forward to the opportunity to discuss how my background aligns with your team's goals.

Best regards,
Jane Smith`

export function CoverLetterClient() {
  const { toast } = useToast()
  const [tone, setTone] = useState("professional")
  const [company, setCompany] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [content, setContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showTones, setShowTones] = useState(false)

  const handleGenerate = async () => {
    if (!company || !jobTitle) {
      toast("Please enter the company name and job title", "warning")
      return
    }
    setIsGenerating(true)
    try {
      // Simulated generation — replace with real API call
      await new Promise((r) => setTimeout(r, 1800))
      setContent(SAMPLE_LETTER)
      toast("Cover letter generated!", "success")
    } catch {
      toast("Generation failed. Please try again.", "error")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    toast("Copied to clipboard", "success")
  }

  const selectedTone = TONES.find((t) => t.id === tone)!

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Cover Letter</h1>
        <p className="text-slate-500 mt-1 text-sm">Generate a tailored cover letter with AI in seconds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />Job Details
            </h2>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Target Company *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="TechCorp Berlin"
                  className="pl-9 h-10 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Job Title *</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Senior Software Engineer"
                  className="pl-9 h-10 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Tone</Label>
              <button
                onClick={() => setShowTones((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-slate-300 transition-colors"
              >
                <div>
                  <span className="font-medium">{selectedTone.label}</span>
                  <span className="text-slate-400 ml-2">— {selectedTone.desc}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", showTones ? "rotate-180" : "")} />
              </button>
              {showTones && (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTone(t.id); setShowTones(false) }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors",
                        tone === t.id ? "bg-blue-50 text-blue-700" : "text-slate-700"
                      )}
                    >
                      <span className="font-medium">{t.label}</span>
                      <span className="text-slate-400 text-xs">{t.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
                : <><Sparkles className="h-4 w-4 mr-2" />Generate Cover Letter</>
              }
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tips</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Address specific company values</li>
              <li>• Include measurable achievements</li>
              <li>• Keep it under one page</li>
              <li>• Mirror keywords from the job post</li>
            </ul>
          </div>
        </div>

        {/* Right: Editor */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">
                {content ? `Cover Letter — ${company || "Company"}` : "Your cover letter will appear here"}
              </span>
              {content && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-600" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5 mr-1" />Copy
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-600" onClick={handleGenerate}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />Regenerate
                  </Button>
                  <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                    <Download className="h-3.5 w-3.5 mr-1" />Download
                  </Button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 min-h-[480px]">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-80 gap-4">
                  <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-700">Writing your cover letter…</p>
                    <p className="text-sm text-slate-500 mt-1">Tailoring to {company || "the company"}</p>
                  </div>
                </div>
              ) : content ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full min-h-[400px] text-sm text-slate-700 leading-relaxed resize-none outline-none font-serif"
                  style={{ fontFamily: "Georgia, serif" }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-80 gap-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">No cover letter yet</p>
                    <p className="text-sm text-slate-500 mt-1">Fill in the job details and click Generate</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
