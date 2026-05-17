import { extractText } from "./text-extractor"
import { detectSections } from "./section-detector"
import { parseContact, type ParsedContact } from "./contact-parser"
import { parseExperience, type ParsedExperience } from "./experience-parser"
import { parseEducation, type ParsedEducation } from "./education-parser"
import { parseSkills, type ParsedSkills } from "./skills-parser"
import { computeATSScore, type ATSBreakdown, type AISuggestion } from "../ats-scorer"

export type { ParsedContact, ParsedExperience, ParsedEducation, ParsedSkills, ATSBreakdown, AISuggestion }

export interface ParsedResume {
  contact: ParsedContact
  summary: string
  experience: ParsedExperience[]
  education: ParsedEducation[]
  skills: ParsedSkills
  projects: { name: string; description: string; technologies: string[] }[]
  certifications: string[]
  languages: string[]
  confidence: {
    overall: number
    contact: number
    experience: number
    education: number
    skills: number
  }
  ats: ATSBreakdown
  rawText: string
  pageCount: number
  fileType: string
  warning?: string
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Parse from a raw file buffer (PDF, DOCX, TXT, RTF, HTML) */
export async function parseResume(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  opts?: { templateId?: string; targetCountry?: string; jobDescription?: string }
): Promise<ParsedResume> {
  const isDev = process.env.NODE_ENV === "development"
  const extracted = await extractText(buffer, mimeType, filename)

  if (isDev) {
    console.log(`[parser] extracted ${extracted.text.length} chars, warning=${extracted.warning ?? "none"}`)
  }

  if (!extracted.text.trim()) {
    return emptyResult(extracted.fileType, extracted.pageCount, extracted.warning)
  }

  return parseText(extracted.text, extracted.fileType, extracted.pageCount, extracted.warning, opts)
}

/** Parse directly from plain text (paste-resume flow) */
export function parseResumeFromText(
  text: string,
  opts?: { templateId?: string; targetCountry?: string; jobDescription?: string }
): ParsedResume {
  return parseText(text, "text", 1, undefined, opts)
}

// ── Internal ───────────────────────────────────────────────────────────────────

function parseText(
  text: string,
  fileType: string,
  pageCount: number,
  warning: string | undefined,
  opts?: { templateId?: string; targetCountry?: string; jobDescription?: string }
): ParsedResume {
  const isDev = process.env.NODE_ENV === "development"
  const sections = detectSections(text)

  if (isDev) {
    console.log(`[parser] sections: ${sections.map((s) => s.type).join(", ")}`)
  }

  const contactSection = sections.find((s) => s.type === "contact")
  const summarySection = sections.find((s) => s.type === "summary")
  const experienceSection = sections.find((s) => s.type === "experience")
  const educationSection = sections.find((s) => s.type === "education")
  const skillsSection = sections.find((s) => s.type === "skills")
  const projectsSection = sections.find((s) => s.type === "projects")
  const certSection = sections.find((s) => s.type === "certifications")
  const langSection = sections.find((s) => s.type === "languages")

  // Contact — parse from top 600 chars + contact section
  const contactText = text.slice(0, 600) + "\n" + (contactSection?.rawText || "")
  const { data: contact, confidence: contactConf } = parseContact(contactText)

  if (isDev) {
    console.log(`[parser] contact: name="${contact.fullName}" email="${contact.email}" phone="${contact.phone}" linkedin="${contact.linkedin}" conf=${contactConf}`)
  }

  // Experience
  const expText = experienceSection?.rawText || ""
  const experience = expText ? parseExperience(expText) : []
  const expConf = experience.length > 0 ? Math.min(60 + experience.length * 10, 95) : 0

  // Education
  const education = educationSection ? parseEducation(educationSection.rawText) : []
  const eduConf = education.length > 0 ? 85 : 0

  // Skills
  const skillsText = skillsSection?.rawText || ""
  const skills = parseSkills(skillsText)
  const skillsConf = skills.all.length > 0 ? Math.min(50 + skills.all.length * 3, 95) : 0

  // Projects
  const projects: ParsedResume["projects"] = []
  if (projectsSection) {
    projectsSection.rawText.split(/\n/).filter((l) => l.trim()).forEach((line) => {
      if (/^[A-Z]/.test(line) && line.length < 80 && !/^[-•]/.test(line)) {
        projects.push({ name: line, description: "", technologies: [] })
      }
    })
  }

  // Certifications
  const certifications: string[] = []
  if (certSection) {
    certSection.rawText.split(/\n/).forEach((l) => {
      const t = l.trim()
      if (t && t.length > 3) certifications.push(t.replace(/^[-•]\s*/, ""))
    })
  }

  // Languages
  const languages: string[] = langSection
    ? langSection.rawText.split(/[,\n]/).map((l) => l.trim()).filter(Boolean)
    : skills.languages

  const overall = Math.round(contactConf * 0.3 + expConf * 0.3 + eduConf * 0.2 + skillsConf * 0.2)

  // ATS score — use the real engine
  const ats = computeATSScore({
    contact,
    summary: summarySection?.rawText || "",
    experience,
    education,
    skills,
    templateId: opts?.templateId,
    targetCountry: opts?.targetCountry,
    jobDescription: opts?.jobDescription,
    importConfidence: overall,
  })

  if (isDev) {
    console.log(`[parser] ats=${ats.total} grade=${ats.grade} missing=[${ats.missing.join(",")}]`)
  }

  return {
    contact,
    summary: summarySection?.rawText || "",
    experience,
    education,
    skills,
    projects,
    certifications,
    languages,
    confidence: { overall, contact: contactConf, experience: expConf, education: eduConf, skills: skillsConf },
    ats,
    rawText: text,
    pageCount,
    fileType,
    warning,
  }
}

function emptyResult(fileType: string, pageCount: number, warning?: string): ParsedResume {
  const emptyAts = computeATSScore({
    contact: {}, summary: "", experience: [], education: [],
    skills: { technical: [], soft: [], tools: [], languages: [], all: [] },
    importConfidence: 0,
  })
  return {
    contact: {},
    summary: "",
    experience: [],
    education: [],
    skills: { technical: [], soft: [], tools: [], languages: [], all: [] },
    projects: [],
    certifications: [],
    languages: [],
    confidence: { overall: 0, contact: 0, experience: 0, education: 0, skills: 0 },
    ats: emptyAts,
    rawText: "",
    pageCount,
    fileType,
    warning: warning ?? "empty",
  }
}
