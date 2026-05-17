export interface ParsedContact {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  website?: string
  jobTitle?: string
}

export interface ContactFieldMeta {
  field: keyof ParsedContact
  value: string
  needsReview: boolean
  reason?: string
}

// Validate that a LinkedIn username looks real (not a protocol or keyword)
const INVALID_LINKEDIN_USERNAMES = new Set(["https", "http", "www", "linkedin", "in", "pub"])

function normalizeLinkedIn(raw: string): string | undefined {
  if (!raw) return undefined
  // Handle full URLs: https://www.linkedin.com/in/username, linkedin.com/in/username
  const urlMatch = raw.match(/linkedin\.com\/in\/([A-Za-z0-9_\-]{3,60})\/?/i)
  if (urlMatch) {
    const username = urlMatch[1].toLowerCase()
    if (INVALID_LINKEDIN_USERNAMES.has(username)) return undefined
    return `linkedin.com/in/${username}`
  }
  // Handle bare usernames: "LinkedIn: johnsmith"
  const bareMatch = raw.match(/linkedin[:\s]+([A-Za-z0-9_\-]{3,60})/i)
  if (bareMatch) {
    const username = bareMatch[1].toLowerCase()
    if (INVALID_LINKEDIN_USERNAMES.has(username) || username.startsWith("http")) return undefined
    return `linkedin.com/in/${username}`
  }
  return undefined
}

function normalizeGitHub(raw: string): string | undefined {
  if (!raw) return undefined
  const urlMatch = raw.match(/github\.com\/([A-Za-z0-9_\-]{1,39})\/?/i)
  if (urlMatch) {
    const username = urlMatch[1]
    if (["https", "http", "www", "github", "blob", "tree", "issues"].includes(username.toLowerCase())) return undefined
    return `github.com/${username}`
  }
  const bareMatch = raw.match(/github[:\s]+([A-Za-z0-9_\-]{1,39})/i)
  if (bareMatch) {
    const username = bareMatch[1]
    if (username.toLowerCase().startsWith("http")) return undefined
    return `github.com/${username}`
  }
  return undefined
}

function normalizePhone(raw: string): string {
  // Remove excessive whitespace, keep digits/+/()-
  return raw.replace(/\s{2,}/g, " ").trim()
}

export function parseContact(text: string): { data: ParsedContact; confidence: number; flags: ContactFieldMeta[] } {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)
  const data: ParsedContact = {}
  const flags: ContactFieldMeta[] = []
  let confidence = 0

  // ── Email ──
  const emailMatch = text.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/)
  if (emailMatch) {
    data.email = emailMatch[0]
    flags.push({ field: "email", value: emailMatch[0], needsReview: false })
    confidence += 20
  }

  // ── Phone — international-aware ──
  // Matches: +1-555-555-5555, (555) 555-5555, +49 123 456789, +91 9876543210, etc.
  const phoneMatch = text.match(
    /(?:\+\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}(?:[\s\-.]?\d{1,4})?/
  )
  if (phoneMatch) {
    const rawPhone = phoneMatch[0].trim()
    // Must have at least 7 digits
    const digits = rawPhone.replace(/\D/g, "")
    if (digits.length >= 7) {
      data.phone = normalizePhone(rawPhone)
      flags.push({ field: "phone", value: data.phone, needsReview: false })
      confidence += 15
    }
  }

  // ── LinkedIn ──
  // Extract the whole LinkedIn context region first
  const linkedinContext = text.match(/(?:linkedin[^\n]{0,120})/i)?.[0] ?? ""
  const linkedin = normalizeLinkedIn(linkedinContext) ?? normalizeLinkedIn(text)
  if (linkedin) {
    data.linkedin = linkedin
    flags.push({ field: "linkedin", value: linkedin, needsReview: false })
    confidence += 10
  }

  // ── GitHub ──
  const githubContext = text.match(/(?:github[^\n]{0,120})/i)?.[0] ?? ""
  const github = normalizeGitHub(githubContext) ?? normalizeGitHub(text)
  if (github) {
    data.github = github
    flags.push({ field: "github", value: github, needsReview: false })
    confidence += 5
  }

  // ── Portfolio / Website — exclude linkedin/github ──
  const websiteMatches = [...text.matchAll(/https?:\/\/(?!(?:www\.)?linkedin\.com|(?:www\.)?github\.com)[A-Za-z0-9.\-\/]+\.[A-Za-z]{2,}[^\s,)>]*/gi)]
  if (websiteMatches.length > 0) {
    data.website = websiteMatches[0][0].replace(/[.,;)]$/, "")
    flags.push({ field: "website", value: data.website, needsReview: false })
  }

  // ── Full Name — look in first 5 non-empty lines ──
  for (const line of lines.slice(0, 6)) {
    if (line.includes("@") || /\d{4,}/.test(line) || !/^[A-Za-z]/.test(line)) continue
    if (/^(resume|curriculum|cv|page\s*\d)/i.test(line)) continue
    const words = line.split(/\s+/)
    if (words.length >= 2 && words.length <= 5 && words.every((w) => /^[A-Za-z][\w\-'.]*$/.test(w))) {
      data.fullName = line
      flags.push({ field: "fullName", value: line, needsReview: false })
      confidence += 20
      break
    }
  }

  // ── Location ──
  // Matches: "San Francisco, CA" / "Berlin, Germany" / "New York, NY 10001"
  const locationMatch = text.match(
    /\b([A-Z][a-z]+(?:[\s\-][A-Z][a-z]+)*),\s*([A-Z]{2}(?:\s+\d{5})?|[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/
  )
  if (locationMatch) {
    data.location = locationMatch[0]
    flags.push({ field: "location", value: locationMatch[0], needsReview: false })
    confidence += 10
  }

  // ── Job Title — look near the top of document ──
  const titleKeywords = [
    "engineer", "developer", "designer", "manager", "analyst", "architect",
    "lead", "senior", "junior", "director", "consultant", "specialist",
    "scientist", "researcher", "coordinator", "administrator", "officer",
    "intern", "associate", "vp ", "vice president", "cto", "ceo", "coo",
    "product", "devops", "cloud", "fullstack", "full-stack", "frontend",
    "backend", "data", "machine learning", "ai ", "ml ", "sre",
  ]
  for (const line of lines.slice(0, 10)) {
    const lower = line.toLowerCase()
    if (
      titleKeywords.some((kw) => lower.includes(kw)) &&
      line.length < 80 &&
      !line.includes("@")
    ) {
      data.jobTitle = line
      flags.push({ field: "jobTitle", value: line, needsReview: false })
      confidence += 15
      break
    }
  }

  return { data, confidence: Math.min(confidence, 100), flags }
}
