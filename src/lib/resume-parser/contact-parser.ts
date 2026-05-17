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

export function parseContact(text: string): { data: ParsedContact; confidence: number } {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)
  const data: ParsedContact = {}
  let confidence = 0

  // Email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/)
  if (emailMatch) {
    data.email = emailMatch[0]
    confidence += 20
  }

  // Phone
  const phoneMatch = text.match(
    /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]([0-9]{3})[-.\s]([0-9]{4})/
  )
  if (phoneMatch) {
    data.phone = phoneMatch[0].trim()
    confidence += 15
  }

  // LinkedIn
  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin:\s*)([A-Za-z0-9\-]+)/i)
  if (linkedinMatch) {
    data.linkedin = `linkedin.com/in/${linkedinMatch[1]}`
    confidence += 10
  }

  // GitHub
  const githubMatch = text.match(/(?:github\.com\/|github:\s*)([A-Za-z0-9\-]+)/i)
  if (githubMatch) {
    data.github = `github.com/${githubMatch[1]}`
    confidence += 10
  }

  // Website / portfolio
  const websiteMatch = text.match(
    /https?:\/\/(?!linkedin|github)[A-Za-z0-9.\-\/]+\.[A-Za-z]{2,}[^\s]*/i
  )
  if (websiteMatch && !data.linkedin && !data.github) {
    data.website = websiteMatch[0]
  }

  // Name: First line that is 2–4 words, no special chars, not an email or phone
  for (const line of lines.slice(0, 5)) {
    if (!line.includes("@") && !/\d{4,}/.test(line) && /^[A-Za-z]/.test(line)) {
      const words = line.split(/\s+/)
      if (words.length >= 2 && words.length <= 5 && words.every((w) => /^[A-Za-z\-'.]+$/.test(w))) {
        data.fullName = line
        confidence += 20
        break
      }
    }
  }

  // Location: look for "City, State" or "City, Country" pattern
  const locationMatch = text.match(
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*([A-Z]{2}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/
  )
  if (locationMatch) {
    data.location = locationMatch[0]
    confidence += 10
  }

  // Job title: look for common title keywords near the top
  const titleKeywords = [
    "engineer", "developer", "designer", "manager", "analyst", "architect",
    "lead", "senior", "junior", "director", "consultant", "specialist",
    "scientist", "researcher", "coordinator", "administrator",
  ]
  for (const line of lines.slice(0, 8)) {
    const lower = line.toLowerCase()
    if (titleKeywords.some((kw) => lower.includes(kw)) && line.length < 80) {
      data.jobTitle = line
      confidence += 15
      break
    }
  }

  return { data, confidence: Math.min(confidence, 100) }
}
