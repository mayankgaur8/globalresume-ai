export type SectionType =
  | "contact"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "awards"
  | "volunteer"
  | "unknown"

const SECTION_PATTERNS: Record<SectionType, RegExp[]> = {
  contact: [/^(contact|contact\s+info(rmation)?|personal\s+info(rmation)?)\s*:?\s*$/i],
  summary: [
    /^(summary|professional\s+summary|career\s+summary|profile|objective|career\s+objective|about\s+me|overview)\s*:?\s*$/i,
  ],
  experience: [
    /^(experience|work\s+experience|professional\s+experience|employment|employment\s+history|work\s+history|career\s+history)\s*:?\s*$/i,
  ],
  education: [/^(education|educational\s+background|academic\s+background|qualifications|academic\s+qualifications)\s*:?\s*$/i],
  skills: [
    /^(skills|technical\s+skills|core\s+competencies|competencies|technologies|tools\s+&\s+technologies|expertise|key\s+skills)\s*:?\s*$/i,
  ],
  projects: [/^(projects|personal\s+projects|key\s+projects|portfolio|side\s+projects)\s*:?\s*$/i],
  certifications: [/^(certifications?|licenses?\s*&?\s+certifications?|credentials|accreditations?)\s*:?\s*$/i],
  languages: [/^(languages?|language\s+proficiency|spoken\s+languages?)\s*:?\s*$/i],
  awards: [/^(awards?|honors?|achievements?|accomplishments?|recognition)\s*:?\s*$/i],
  volunteer: [/^(volunteer|volunteering|community\s+service|volunteer\s+experience)\s*:?\s*$/i],
  unknown: [],
}

export interface DetectedSection {
  type: SectionType
  startLine: number
  endLine: number
  rawText: string
}

export function detectSections(text: string): DetectedSection[] {
  const lines = text.split(/\n/)
  const sections: DetectedSection[] = []

  let currentType: SectionType = "contact"
  let currentStart = 0

  const closeSection = (endLine: number) => {
    const rawText = lines.slice(currentStart, endLine).join("\n").trim()
    if (rawText) {
      sections.push({ type: currentType, startLine: currentStart, endLine, rawText })
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    let matched: SectionType | null = null
    for (const [type, patterns] of Object.entries(SECTION_PATTERNS) as [SectionType, RegExp[]][]) {
      if (type === "unknown") continue
      if (patterns.some((p) => p.test(line))) {
        matched = type
        break
      }
    }

    if (matched) {
      closeSection(i)
      currentType = matched
      currentStart = i + 1
    }
  }

  closeSection(lines.length)
  return sections
}
