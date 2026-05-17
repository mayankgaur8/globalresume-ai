import { extractText } from "./text-extractor"
import { detectSections } from "./section-detector"
import { parseContact, type ParsedContact } from "./contact-parser"
import { parseExperience, type ParsedExperience } from "./experience-parser"
import { parseEducation, type ParsedEducation } from "./education-parser"
import { parseSkills, type ParsedSkills } from "./skills-parser"

export type { ParsedContact, ParsedExperience, ParsedEducation, ParsedSkills }

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
  ats: {
    score: number
    missing: string[]
    suggestions: string[]
  }
  rawText: string
  pageCount: number
  fileType: string
}

export async function parseResume(buffer: Buffer, mimeType: string, filename: string): Promise<ParsedResume> {
  const { text, pageCount, fileType } = await extractText(buffer, mimeType, filename)
  const sections = detectSections(text)

  const contactSection = sections.find((s) => s.type === "contact")
  const summarySection = sections.find((s) => s.type === "summary")
  const experienceSection = sections.find((s) => s.type === "experience")
  const educationSection = sections.find((s) => s.type === "education")
  const skillsSection = sections.find((s) => s.type === "skills")
  const projectsSection = sections.find((s) => s.type === "projects")
  const certSection = sections.find((s) => s.type === "certifications")
  const langSection = sections.find((s) => s.type === "languages")

  // Parse contact from top of doc + contact section
  const contactText = text.slice(0, 500) + (contactSection?.rawText || "")
  const { data: contact, confidence: contactConf } = parseContact(contactText)

  // Experience
  const experience = experienceSection ? parseExperience(experienceSection.rawText) : []
  const expConf = experience.length > 0 ? Math.min(60 + experience.length * 10, 95) : 0

  // Education
  const education = educationSection ? parseEducation(educationSection.rawText) : []
  const eduConf = education.length > 0 ? 85 : 0

  // Skills
  const skillsText = skillsSection?.rawText || ""
  const skills = parseSkills(skillsText)
  const skillsConf = skills.all.length > 0 ? Math.min(50 + skills.all.length * 3, 95) : 0

  // Projects: simple extraction
  const projects: ParsedResume["projects"] = []
  if (projectsSection) {
    const projLines = projectsSection.rawText.split(/\n/).filter((l) => l.trim())
    for (const line of projLines) {
      if (/^[A-Z]/.test(line) && line.length < 80 && !/^[-•]/.test(line)) {
        projects.push({ name: line, description: "", technologies: [] })
      }
    }
  }

  // Certifications
  const certifications: string[] = []
  if (certSection) {
    certSection.rawText.split(/\n/).forEach((l) => {
      const t = l.trim()
      if (t && t.length > 3) certifications.push(t.replace(/^[-•]\s*/, ""))
    })
  }

  // Languages from lang section or skills
  const languages: string[] = langSection
    ? langSection.rawText.split(/[,\n]/).map((l) => l.trim()).filter(Boolean)
    : skills.languages

  // Overall confidence
  const overall = Math.round(
    (contactConf * 0.3 + expConf * 0.3 + eduConf * 0.2 + skillsConf * 0.2)
  )

  // ATS analysis
  const ats = computeAts(contact, experience, education, skills, summarySection?.rawText || "")

  return {
    contact,
    summary: summarySection?.rawText || "",
    experience,
    education,
    skills,
    projects,
    certifications,
    languages,
    confidence: {
      overall,
      contact: contactConf,
      experience: expConf,
      education: eduConf,
      skills: skillsConf,
    },
    ats,
    rawText: text,
    pageCount,
    fileType,
  }
}

function computeAts(
  contact: ParsedContact,
  experience: ParsedExperience[],
  education: ParsedEducation[],
  skills: ParsedSkills,
  summary: string
): { score: number; missing: string[]; suggestions: string[] } {
  let score = 0
  const missing: string[] = []
  const suggestions: string[] = []

  if (contact.email) score += 10; else missing.push("Email address")
  if (contact.phone) score += 8; else missing.push("Phone number")
  if (contact.fullName) score += 10; else missing.push("Full name")
  if (contact.linkedin) score += 7; else suggestions.push("Add your LinkedIn profile URL")
  if (contact.location) score += 5

  if (summary) score += 15; else { missing.push("Professional summary"); suggestions.push("Add a 2-3 sentence summary highlighting your value proposition") }

  if (experience.length >= 2) score += 20
  else if (experience.length === 1) { score += 12; suggestions.push("Add more work experience entries") }
  else { missing.push("Work experience"); suggestions.push("Add at least one work experience entry") }

  const hasQuantifiedBullets = experience.some((e) => e.bullets.some((b) => /\d+%|\d+x|\$[\d,]+|\d+\s+(?:users|customers|team|employees)/i.test(b)))
  if (hasQuantifiedBullets) score += 10
  else suggestions.push("Quantify your achievements with numbers (e.g., 'Increased sales by 30%')")

  if (education.length > 0) score += 10; else { missing.push("Education"); suggestions.push("Add your educational background") }

  if (skills.technical.length >= 5) score += 10
  else if (skills.technical.length > 0) { score += 5; suggestions.push("List at least 5 technical skills relevant to your target role") }
  else { missing.push("Technical skills") }

  if (skills.all.length >= 10) score += 5

  return { score: Math.min(score, 100), missing, suggestions }
}
