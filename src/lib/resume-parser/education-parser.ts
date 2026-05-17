export interface ParsedEducation {
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa?: string
  location: string
}

const DEGREE_PATTERNS = [
  /\b(Bachelor(?:'s)?(?:\s+of\s+[A-Za-z\s]+)?|B\.?S\.?|B\.?A\.?|B\.?E\.?|B\.?Sc\.?)\b/i,
  /\b(Master(?:'s)?(?:\s+of\s+[A-Za-z\s]+)?|M\.?S\.?|M\.?A\.?|M\.?B\.?A\.?|M\.?Eng\.?|M\.?Sc\.?)\b/i,
  /\b(Ph\.?D\.?|Doctorate|Doctor\s+of\s+[A-Za-z\s]+)\b/i,
  /\b(Associate(?:'s)?(?:\s+of\s+[A-Za-z\s]+)?|A\.?S\.?|A\.?A\.?)\b/i,
  /\b(High\s+School|Secondary\s+School|Diploma|GED|Certificate)\b/i,
]

const YEAR_RANGE = /(\d{4})\s*[-–—to]+\s*(\d{4}|Present|Current)/i
const YEAR_SINGLE = /\b(20[0-9]{2}|19[0-9]{2})\b/

function findDegree(text: string): string {
  for (const pattern of DEGREE_PATTERNS) {
    const m = text.match(pattern)
    if (m) return m[0]
  }
  return ""
}

export function parseEducation(text: string): ParsedEducation[] {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)
  const educations: ParsedEducation[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const degree = findDegree(line)

    if (degree) {
      const edu: ParsedEducation = {
        institution: "",
        degree: degree,
        field: "",
        startDate: "",
        endDate: "",
        location: "",
      }

      // Extract date from this or next line
      const dateBlock = lines.slice(i, Math.min(i + 3, lines.length)).join(" ")
      const rangeMatch = dateBlock.match(YEAR_RANGE)
      if (rangeMatch) {
        edu.startDate = rangeMatch[1]
        edu.endDate = rangeMatch[2]
      } else {
        const singleMatch = dateBlock.match(YEAR_SINGLE)
        if (singleMatch) edu.endDate = singleMatch[1]
      }

      // Field of study — look for "in X" or "of X" after degree
      const fieldMatch = line.match(/(?:in|of)\s+([A-Za-z\s]+?)(?:,|\.|$)/i)
      if (fieldMatch) edu.field = fieldMatch[1].trim()

      // GPA
      const gpaMatch = dateBlock.match(/GPA[:\s]+([0-9.]+)/i)
      if (gpaMatch) edu.gpa = gpaMatch[1]

      // Institution: look for capitalized line nearby that isn't the degree line
      for (let j = Math.max(0, i - 1); j <= Math.min(lines.length - 1, i + 2); j++) {
        const l = lines[j]
        if (l === line) continue
        if (/[A-Z]/.test(l[0]) && l.length < 100 && !findDegree(l) && !/^\d/.test(l)) {
          edu.institution = l
          break
        }
      }

      educations.push(edu)
    }

    i++
  }

  return educations
}
