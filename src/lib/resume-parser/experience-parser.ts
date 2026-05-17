export interface ParsedExperience {
  company: string
  title: string
  startDate: string
  endDate: string
  current: boolean
  location: string
  bullets: string[]
}

const MONTHS = "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?"
const DATE_RE = new RegExp(
  `((?:${MONTHS})\\s+\\d{4}|\\d{1,2}\\/\\d{4}|\\d{4})\\s*[-–—to]+\\s*((?:${MONTHS})\\s+\\d{4}|\\d{1,2}\\/\\d{4}|\\d{4}|Present|Current|Now)`,
  "gi"
)

const TITLE_KEYWORDS = [
  "engineer", "developer", "designer", "manager", "analyst", "architect",
  "lead", "senior", "junior", "director", "consultant", "specialist",
  "scientist", "researcher", "coordinator", "administrator", "intern",
  "associate", "executive", "officer", "vp", "vice president", "cto", "ceo",
]

function looksLikeTitle(line: string): boolean {
  const lower = line.toLowerCase()
  return TITLE_KEYWORDS.some((kw) => lower.includes(kw)) && line.length < 100
}

function looksLikeCompany(line: string): boolean {
  return (
    /[A-Z]/.test(line[0]) &&
    line.length < 80 &&
    !/^\s*[-•·]/.test(line) &&
    !/^http/i.test(line) &&
    !/\d{4}/.test(line)
  )
}

export function parseExperience(text: string): ParsedExperience[] {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)
  const experiences: ParsedExperience[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const dateMatch = DATE_RE.exec(line)
    DATE_RE.lastIndex = 0

    if (dateMatch || looksLikeTitle(line) || (i < lines.length - 1 && DATE_RE.exec(lines[i + 1]))) {
      DATE_RE.lastIndex = 0
      const exp: ParsedExperience = {
        company: "",
        title: "",
        startDate: "",
        endDate: "",
        current: false,
        location: "",
        bullets: [],
      }

      // Try to get title + company from lines around date
      const blockStart = Math.max(0, i - 1)
      const blockEnd = Math.min(lines.length - 1, i + 2)

      // Find date in nearby lines
      for (let j = blockStart; j <= blockEnd; j++) {
        const m = DATE_RE.exec(lines[j])
        DATE_RE.lastIndex = 0
        if (m) {
          exp.startDate = m[1]
          exp.endDate = m[2]
          exp.current = /present|current|now/i.test(m[2])
          // Remove date from line to get remaining info
          const remaining = lines[j].replace(m[0], "").replace(/[|\-–,]/g, " ").trim()
          if (remaining && !exp.location) {
            exp.location = remaining
          }
        }
      }

      // Assign title and company from nearby non-date lines
      const candidates = [lines[blockStart], lines[i]].filter(
        (l) => l && !DATE_RE.test(l)
      )
      DATE_RE.lastIndex = 0

      for (const c of candidates) {
        if (!exp.title && looksLikeTitle(c)) {
          exp.title = c
        } else if (!exp.company && looksLikeCompany(c)) {
          exp.company = c
        }
      }

      // Collect bullet points
      let j = blockEnd + 1
      while (j < lines.length) {
        const l = lines[j]
        // Stop if we hit another job block (date or title pattern)
        if (DATE_RE.test(l) && exp.bullets.length > 0) {
          DATE_RE.lastIndex = 0
          break
        }
        DATE_RE.lastIndex = 0
        if (/^[-•·▪◦‣]/.test(l) || /^\d+\./.test(l)) {
          exp.bullets.push(l.replace(/^[-•·▪◦‣\d.]\s*/, ""))
        } else if (l.length > 20 && exp.bullets.length > 0) {
          // continuation of previous bullet
          exp.bullets[exp.bullets.length - 1] += " " + l
        } else {
          break
        }
        j++
      }

      if (exp.title || exp.company) {
        experiences.push(exp)
        i = j
        continue
      }
    }
    i++
  }

  return experiences
}
