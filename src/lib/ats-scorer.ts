import type { ParsedContact } from "./resume-parser/contact-parser"
import type { ParsedExperience } from "./resume-parser/experience-parser"
import type { ParsedEducation } from "./resume-parser/education-parser"
import type { ParsedSkills } from "./resume-parser/skills-parser"

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ATSSectionScore {
  label: string
  score: number
  maxScore: number
  pct: number
  notes: string[]       // what was found (positive)
  deductions: string[]  // why points were lost
}

export type SuggestionPriority = "high" | "medium" | "low"

export interface AISuggestion {
  id: string
  priority: SuggestionPriority
  section: string
  title: string
  reason: string
  fix: string
  exampleText?: string
}

export type ATSSafetyLevel = "high" | "medium" | "low"

export interface ATSBreakdown {
  total: number
  maxTotal: 100
  grade: string          // A, B, C, D, F
  safetyLevel: ATSSafetyLevel
  sections: {
    contact: ATSSectionScore
    summary: ATSSectionScore
    experience: ATSSectionScore
    achievements: ATSSectionScore
    skills: ATSSectionScore
    education: ATSSectionScore
    keywords: ATSSectionScore
    formatting: ATSSectionScore
  }
  missing: string[]
  suggestions: AISuggestion[]
  confidenceNote?: string
  jobMatchMode: boolean  // true if job description was provided
}

// ── Score weights ──────────────────────────────────────────────────────────────
//   contact: 10 | summary: 10 | experience: 20 | achievements: 15
//   skills: 15  | education: 10 | keywords: 10  | formatting: 10
//   total: 100

// ── Helpers ────────────────────────────────────────────────────────────────────

function section(label: string, score: number, maxScore: number, notes: string[], deductions: string[]): ATSSectionScore {
  return { label, score: Math.max(0, Math.min(score, maxScore)), maxScore, pct: Math.round((Math.min(score, maxScore) / maxScore) * 100), notes, deductions }
}

function grade(total: number): string {
  if (total >= 90) return "A+"
  if (total >= 80) return "A"
  if (total >= 70) return "B+"
  if (total >= 60) return "B"
  if (total >= 50) return "C"
  if (total >= 40) return "D"
  return "F"
}

function sid(section: string, idx: number) { return `${section}_${idx}` }

// ── Main scorer ────────────────────────────────────────────────────────────────

export function computeATSScore(input: {
  contact: ParsedContact
  summary: string
  experience: ParsedExperience[]
  education: ParsedEducation[]
  skills: ParsedSkills
  templateId?: string
  targetCountry?: string
  jobDescription?: string
  importConfidence?: number
}): ATSBreakdown {
  const {
    contact, summary, experience, education, skills,
    templateId = "minimal", targetCountry = "US", jobDescription,
    importConfidence = 100,
  } = input

  const missing: string[] = []
  const suggestions: AISuggestion[] = []
  let suggIdx = 0

  // ── 1. Contact (max 10) ────────────────────────────────────────────────────
  let contactScore = 0
  const contactNotes: string[] = []
  const contactDeductions: string[] = []

  if (contact.fullName) { contactScore += 3; contactNotes.push("Full name found") }
  else { contactDeductions.push("Full name missing"); missing.push("Full name") }

  if (contact.email) { contactScore += 3; contactNotes.push("Email found") }
  else { contactDeductions.push("Email missing"); missing.push("Email address") }

  if (contact.phone) { contactScore += 2; contactNotes.push("Phone found") }
  else {
    contactDeductions.push("Phone number missing")
    missing.push("Phone number")
    suggestions.push({
      id: sid("contact", suggIdx++), priority: "high", section: "Contact",
      title: "Add your phone number",
      reason: "ATS systems and recruiters expect a phone number for immediate contact.",
      fix: "Add your mobile or direct phone number in international format, e.g. +1 555 555 5555",
    })
  }

  if (contact.location) { contactScore += 1; contactNotes.push("Location found") }
  else {
    contactDeductions.push("Location/city missing")
    suggestions.push({
      id: sid("contact", suggIdx++), priority: "medium", section: "Contact",
      title: "Add your city and country",
      reason: "Recruiters filter candidates by location. Missing city reduces shortlisting chances.",
      fix: "Add your current city and country, e.g. 'San Francisco, CA' or 'Berlin, Germany'",
    })
  }

  if (contact.linkedin) { contactScore += 1; contactNotes.push("LinkedIn found") }
  else {
    suggestions.push({
      id: sid("contact", suggIdx++), priority: "medium", section: "Contact",
      title: "Add your LinkedIn profile URL",
      reason: "85% of recruiters check LinkedIn before interviews. A missing URL reduces credibility.",
      fix: "Add linkedin.com/in/your-username to your contact section",
    })
  }

  const contactSection = section("Contact", contactScore, 10, contactNotes, contactDeductions)

  // ── 2. Summary (max 10) ────────────────────────────────────────────────────
  let summaryScore = 0
  const summaryNotes: string[] = []
  const summaryDeductions: string[] = []

  if (summary && summary.trim().length > 0) {
    const wordCount = summary.trim().split(/\s+/).length
    if (wordCount >= 30) { summaryScore += 8; summaryNotes.push("Strong summary present") }
    else if (wordCount >= 10) { summaryScore += 5; summaryNotes.push("Summary present but short"); summaryDeductions.push("Summary under 30 words") }
    else { summaryScore += 2; summaryNotes.push("Summary present (very short)"); summaryDeductions.push("Summary too brief") }

    const hasRoleKeyword = /engineer|developer|analyst|manager|designer|architect|lead|director|scientist|consultant/i.test(summary)
    if (hasRoleKeyword) { summaryScore += 2; summaryNotes.push("Contains role keyword") }
    else { summaryDeductions.push("Summary doesn't mention your role/specialization") }
  } else {
    missing.push("Professional summary")
    summaryDeductions.push("No professional summary found")
    suggestions.push({
      id: sid("summary", suggIdx++), priority: "high", section: "Summary",
      title: "Write a professional summary (2–3 sentences)",
      reason: "Recruiters spend 6 seconds scanning a resume. A strong opening summary dramatically increases read-through rate.",
      fix: "Add a 2–3 sentence summary at the top. Include your role, years of experience, and top 2 achievements.",
      exampleText: "Results-driven Software Engineer with 5+ years building scalable web applications. Proven track record reducing infrastructure costs by 40% and leading cross-functional teams of 6+. Expert in React, Node.js, and AWS.",
    })
  }

  const summarySection = section("Summary", summaryScore, 10, summaryNotes, summaryDeductions)

  // ── 3. Work Experience (max 20) ────────────────────────────────────────────
  let expScore = 0
  const expNotes: string[] = []
  const expDeductions: string[] = []

  if (experience.length === 0) {
    missing.push("Work experience")
    expDeductions.push("No work experience detected")
    suggestions.push({
      id: sid("experience", suggIdx++), priority: "high", section: "Experience",
      title: "Add at least one work experience entry",
      reason: "Work history is the most important section for recruiters and ATS systems.",
      fix: "Add your most recent role including company name, job title, dates, and 3–5 bullet points.",
    })
  } else {
    if (experience.length === 1) { expScore += 10; expNotes.push("1 role found"); expDeductions.push("Only 1 role listed — add more for stronger history") }
    else if (experience.length === 2) { expScore += 15; expNotes.push(`${experience.length} roles found`) }
    else { expScore += 20; expNotes.push(`${experience.length} roles found`) }

    // Check title/company completeness
    const withTitle = experience.filter((e) => e.title).length
    const withCompany = experience.filter((e) => e.company).length
    if (withTitle < experience.length) expDeductions.push(`${experience.length - withTitle} role(s) missing job title`)
    if (withCompany < experience.length) expDeductions.push(`${experience.length - withCompany} role(s) missing company name`)

    // Check date completeness
    const withDates = experience.filter((e) => e.startDate || e.endDate).length
    if (withDates === 0) expDeductions.push("No dates detected on any role")
    else if (withDates < experience.length) expDeductions.push(`${experience.length - withDates} role(s) missing dates`)

    // Gaps check (simplified)
    const hasCurrent = experience.some((e) => e.current)
    if (!hasCurrent && experience.length > 0) {
      expNotes.push("No current role marked")
    }
  }

  const expSection = section("Work Experience", expScore, 20, expNotes, expDeductions)

  // ── 4. Quantified Achievements (max 15) ────────────────────────────────────
  let achScore = 0
  const achNotes: string[] = []
  const achDeductions: string[] = []

  const allBullets = experience.flatMap((e) => e.bullets)
  const metricRe = /\d+\s*%|\d+x|\$[\d,]+[MKB]?|\d+[\s,]+(?:users|customers|clients|team|employees|engineers|people|applications|services|projects|features|releases|tickets|bugs|repos|api|microsec|ms\b)/i
  const actionRe = /^(?:led|built|designed|developed|implemented|architected|reduced|improved|increased|optimized|launched|delivered|created|managed|owned|drove|scaled|migrated|deployed|automated|refactored|established|generated|saved|achieved)/i

  const quantifiedBullets = allBullets.filter((b) => metricRe.test(b))
  const actionBullets = allBullets.filter((b) => actionRe.test(b))

  if (quantifiedBullets.length >= 3) { achScore += 15; achNotes.push(`${quantifiedBullets.length} quantified achievements found`) }
  else if (quantifiedBullets.length >= 1) { achScore += 9; achNotes.push(`${quantifiedBullets.length} quantified achievement(s)`); achDeductions.push("Add more measurable outcomes") }
  else if (actionBullets.length >= 3) { achScore += 5; achNotes.push("Action verbs used"); achDeductions.push("No metrics or numbers detected in bullets") }
  else { achDeductions.push("Bullets lack action verbs and measurable results") }

  if (quantifiedBullets.length < 3 && experience.length > 0) {
    const firstExpWithBullets = experience.find((e) => e.bullets.length > 0)
    suggestions.push({
      id: sid("achievements", suggIdx++), priority: "high", section: "Experience",
      title: `Add 3–5 quantified achievements under ${firstExpWithBullets?.company || "each role"}`,
      reason: "ATS systems and recruiters rank impact-driven bullet points significantly higher than duty lists.",
      fix: "Rewrite bullets using the formula: Action Verb + What You Did + Measurable Result",
      exampleText: "• Reduced API response time by 45% by migrating to Redis caching, improving user retention by 12%\n• Led a team of 6 engineers delivering 3 product features on schedule, increasing revenue by $200K",
    })
  }

  const achSection = section("Quantified Achievements", achScore, 15, achNotes, achDeductions)

  // ── 5. Skills (max 15) ────────────────────────────────────────────────────
  let skillsScore = 0
  const skillsNotes: string[] = []
  const skillsDeductions: string[] = []

  const totalSkills = skills.all.length
  const techSkills = skills.technical.length

  if (totalSkills >= 15) { skillsScore += 15; skillsNotes.push(`${totalSkills} skills listed`) }
  else if (totalSkills >= 8) { skillsScore += 10; skillsNotes.push(`${totalSkills} skills listed`); skillsDeductions.push("List 15+ skills for maximum ATS keyword matching") }
  else if (totalSkills >= 4) { skillsScore += 6; skillsNotes.push(`${totalSkills} skills listed`); skillsDeductions.push("Too few skills — ATS may rank you lower for keyword match") }
  else if (totalSkills > 0) { skillsScore += 3; skillsDeductions.push("Very few skills listed") }
  else { missing.push("Skills section"); skillsDeductions.push("No skills section detected") }

  if (techSkills === 0 && totalSkills > 0) {
    skillsDeductions.push("No recognizable technical skills found")
    suggestions.push({
      id: sid("skills", suggIdx++), priority: "medium", section: "Skills",
      title: "Add technical skills with standard names",
      reason: "ATS systems match job requirements against exact skill keywords. Generic terms may not match.",
      fix: "Use standard names: 'JavaScript', 'Python', 'AWS', 'Docker', 'React', 'PostgreSQL'",
    })
  }

  if (totalSkills < 8) {
    suggestions.push({
      id: sid("skills", suggIdx++), priority: "medium", section: "Skills",
      title: "Expand your skills section",
      reason: `You have ${totalSkills} skill${totalSkills !== 1 ? "s" : ""} listed. ATS systems use skills for keyword ranking.`,
      fix: "List all tools, languages, frameworks, platforms, and methodologies you use regularly.",
    })
  }

  const skillsSection = section("Skills", skillsScore, 15, skillsNotes, skillsDeductions)

  // ── 6. Education (max 10) ──────────────────────────────────────────────────
  let eduScore = 0
  const eduNotes: string[] = []
  const eduDeductions: string[] = []

  if (education.length === 0) {
    missing.push("Education")
    eduDeductions.push("No education section detected")
    suggestions.push({
      id: sid("education", suggIdx++), priority: "high", section: "Education",
      title: "Add your education history",
      reason: "Most job postings require or prefer candidates with listed education. Missing it risks ATS rejection.",
      fix: "Add your degree, institution, graduation year. Include GPA only if 3.5+.",
    })
  } else {
    const hasInstitution = education.filter((e) => e.institution).length
    const hasDegree = education.filter((e) => e.degree).length
    const hasDate = education.filter((e) => e.endDate || e.startDate).length

    if (hasInstitution === education.length && hasDegree === education.length) {
      eduScore += 8; eduNotes.push(`${education.length} education entr${education.length === 1 ? "y" : "ies"} found`)
    } else {
      eduScore += 5
      if (hasInstitution < education.length) eduDeductions.push("Some entries missing institution name")
      if (hasDegree < education.length) eduDeductions.push("Some entries missing degree")
    }

    if (hasDate === education.length) { eduScore += 2; eduNotes.push("Graduation years found") }
    else eduDeductions.push("Missing graduation year on some entries")
  }

  const eduSection = section("Education", eduScore, 10, eduNotes, eduDeductions)

  // ── 7. Keywords / Job Match (max 10) ──────────────────────────────────────
  let kwScore = 0
  const kwNotes: string[] = []
  const kwDeductions: string[] = []
  const jobMatchMode = Boolean(jobDescription?.trim())

  if (jobMatchMode && jobDescription) {
    const jd = jobDescription.toLowerCase()
    const resumeText = [
      summary,
      ...experience.flatMap((e) => [e.title, e.company, ...e.bullets]),
      ...skills.all,
    ].join(" ").toLowerCase()

    // Extract meaningful words from JD (3+ chars, no stopwords)
    const stopwords = new Set(["the", "and", "for", "with", "you", "are", "have", "will", "our", "this", "that", "your", "from", "their", "been"])
    const jdWords = [...new Set(jd.match(/\b[a-z][a-z0-9+\-#.]{2,}\b/g) ?? [])].filter((w) => !stopwords.has(w))

    const matched = jdWords.filter((w) => resumeText.includes(w))
    const matchPct = jdWords.length > 0 ? matched.length / jdWords.length : 0

    if (matchPct >= 0.6) { kwScore += 10; kwNotes.push(`${Math.round(matchPct * 100)}% job keyword match`) }
    else if (matchPct >= 0.4) { kwScore += 6; kwNotes.push(`${Math.round(matchPct * 100)}% keyword match`); kwDeductions.push("Match below 60% — tailor resume more closely") }
    else { kwScore += 2; kwDeductions.push(`Only ${Math.round(matchPct * 100)}% keyword match`); kwDeductions.push("Resume may not pass ATS for this job") }

    // Find top missing keywords
    const missingKw = jdWords
      .filter((w) => !resumeText.includes(w) && w.length > 4)
      .slice(0, 8)

    if (missingKw.length > 0) {
      suggestions.push({
        id: sid("keywords", suggIdx++), priority: "high", section: "Skills",
        title: "Add missing job keywords to your resume",
        reason: `Your resume is missing ${missingKw.length} keywords from the job description.`,
        fix: `Add these terms naturally in your summary, bullets, or skills section: ${missingKw.slice(0, 5).join(", ")}`,
      })
    }
  } else {
    // Baseline: check for generic professional keywords
    const resumeText = [summary, ...skills.all, ...experience.flatMap((e) => e.bullets)].join(" ").toLowerCase()
    const baselineKw = ["manage", "lead", "develop", "implement", "design", "analyze", "collaborate", "deliver"]
    const found = baselineKw.filter((k) => resumeText.includes(k))
    kwScore = Math.min(10, Math.round((found.length / baselineKw.length) * 10))
    kwNotes.push("Baseline score — paste a job description for exact match")
    if (kwScore < 7) kwDeductions.push("Resume lacks common professional action keywords")
  }

  const kwSection = section(jobMatchMode ? "Job Keyword Match" : "Keyword Density", kwScore, 10, kwNotes, kwDeductions)

  // ── 8. Formatting / ATS Safety (max 10) ───────────────────────────────────
  let fmtScore = 10
  const fmtNotes: string[] = []
  const fmtDeductions: string[] = []

  // Photo-heavy / creative templates reduce ATS safety
  const PHOTO_TEMPLATES = ["german", "french", "japanese", "creative"]
  const RISKY_TEMPLATES = ["creative"]
  const isPhotoTemplate = PHOTO_TEMPLATES.includes(templateId)
  const isRiskyTemplate = RISKY_TEMPLATES.includes(templateId)
  const usTargets = ["us", "usa", "united states", "canada", "uk", "united kingdom"]
  const isUsMarket = usTargets.some((c) => targetCountry.toLowerCase().includes(c))

  if (isRiskyTemplate) {
    fmtScore -= 4; fmtDeductions.push("Creative template may not parse correctly in strict ATS systems")
    suggestions.push({
      id: sid("formatting", suggIdx++), priority: "medium", section: "Template",
      title: "Switch to an ATS-safe template for this market",
      reason: "Creative templates with multi-column layouts and graphics can cause ATS parsing failures.",
      fix: "Use 'ATS Classic' or 'Minimal ATS' for applications to companies using automated screening.",
    })
  } else if (["modern", "executive", "global"].includes(templateId)) {
    fmtScore -= 1; fmtNotes.push("Good ATS compatibility with minor layout risk")
  } else {
    fmtNotes.push("ATS-safe template detected")
  }

  if (isPhotoTemplate && isUsMarket) {
    fmtScore -= 2; fmtDeductions.push(`Photo templates are not recommended for ${targetCountry} job market`)
    suggestions.push({
      id: sid("formatting", suggIdx++), priority: "medium", section: "Template",
      title: `Remove photo for ${targetCountry} applications`,
      reason: `In ${targetCountry}, photos on resumes can trigger unconscious bias screening or ATS rejection. Most employers explicitly ask for no photo.`,
      fix: "Switch to a no-photo template variant for US/UK/Canada market. Reserve photo templates for European or Asian applications.",
    })
  }

  if (fmtNotes.length === 0 && fmtDeductions.length === 0) fmtNotes.push("Standard formatting detected")

  const fmtSection = section("ATS Formatting", Math.max(0, fmtScore), 10, fmtNotes, fmtDeductions)

  // ── Final assembly ─────────────────────────────────────────────────────────
  const sections = {
    contact: contactSection,
    summary: summarySection,
    experience: expSection,
    achievements: achSection,
    skills: skillsSection,
    education: eduSection,
    keywords: kwSection,
    formatting: fmtSection,
  }

  const total = Math.min(100, Object.values(sections).reduce((s, sec) => s + sec.score, 0))
  const safetyLevel: ATSSafetyLevel = fmtSection.score >= 8 ? "high" : fmtSection.score >= 5 ? "medium" : "low"

  let confidenceNote: string | undefined
  if (importConfidence < 50) {
    confidenceNote = "Score may be approximate — low confidence in parsed data. Review imported fields and correct any errors."
  } else if (importConfidence < 75) {
    confidenceNote = "Score is based on partially parsed data. Review each section for accuracy."
  }

  return {
    total,
    maxTotal: 100,
    grade: grade(total),
    safetyLevel,
    sections,
    missing,
    suggestions: suggestions.sort((a, b) =>
      (a.priority === "high" ? 0 : a.priority === "medium" ? 1 : 2) -
      (b.priority === "high" ? 0 : b.priority === "medium" ? 1 : 2)
    ),
    confidenceNote,
    jobMatchMode,
  }
}
