import { describe, it, expect } from "vitest"
import { computeATSScore } from "@/lib/ats-scorer"
import type { ParsedContact } from "@/lib/resume-parser/contact-parser"
import type { ParsedExperience } from "@/lib/resume-parser/experience-parser"
import type { ParsedEducation } from "@/lib/resume-parser/education-parser"
import type { ParsedSkills } from "@/lib/resume-parser/skills-parser"

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fullContact: ParsedContact = {
  fullName: "Jane Smith",
  email: "jane@example.com",
  phone: "+1 555 000 0000",
  location: "San Francisco, CA",
  linkedin: "linkedin.com/in/janesmith",
  website: "",
}

const emptyContact: ParsedContact = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
}

const strongExperience: ParsedExperience[] = [
  {
    title: "Senior Engineer",
    company: "Acme Corp",
    startDate: "2021-01",
    endDate: "2023-12",
    current: false,
    location: "San Francisco, CA",
    bullets: [
      "Reduced API latency by 45% using Redis caching",
      "Led team of 6 engineers across 3 product releases",
      "Increased revenue by $200K by launching new billing feature",
    ],
  },
  {
    title: "Software Engineer",
    company: "Beta Inc",
    startDate: "2019-01",
    endDate: "2021-01",
    current: false,
    location: "New York, NY",
    bullets: ["Built REST APIs", "Deployed to AWS"],
  },
  {
    title: "Junior Dev",
    company: "Gamma Ltd",
    startDate: "2017-06",
    endDate: "2019-01",
    current: false,
    location: "",
    bullets: ["Maintained React components"],
  },
]

const richSkills: ParsedSkills = {
  all: ["TypeScript", "React", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS", "Python", "GraphQL", "CI/CD", "Terraform", "Kubernetes", "Jest", "Next.js", "Git"],
  technical: ["TypeScript", "React", "Node.js", "PostgreSQL", "Redis"],
  soft: ["Leadership", "Communication"],
  tools: ["Docker", "Git", "Jest"],
  languages: ["TypeScript", "Python"],
}

const thinSkills: ParsedSkills = {
  all: ["JavaScript", "React"],
  technical: ["JavaScript", "React"],
  soft: [],
  tools: [],
  languages: [],
}

const fullEducation: ParsedEducation[] = [
  { institution: "MIT", degree: "B.S. Computer Science", field: "CS", startDate: "2013-09", endDate: "2017-05", location: "Cambridge, MA" },
]

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("computeATSScore — high-quality resume", () => {
  it("scores 80+ for a complete, quantified resume", () => {
    const result = computeATSScore({
      contact: fullContact,
      summary: "Results-driven Senior Software Engineer with 6+ years building scalable distributed systems. Proven track record reducing infrastructure costs by 40% and leading cross-functional teams.",
      experience: strongExperience,
      education: fullEducation,
      skills: richSkills,
      templateId: "minimal",
      targetCountry: "US",
    })
    expect(result.total).toBeGreaterThanOrEqual(80)
    expect(result.grade).toMatch(/^A/)
    expect(result.safetyLevel).toBe("high")
  })

  it("assigns correct section structure", () => {
    const result = computeATSScore({
      contact: fullContact,
      summary: "Strong professional summary for a software engineer with quantified results.",
      experience: strongExperience,
      education: fullEducation,
      skills: richSkills,
    })
    expect(result.sections).toHaveProperty("contact")
    expect(result.sections).toHaveProperty("summary")
    expect(result.sections).toHaveProperty("experience")
    expect(result.sections).toHaveProperty("achievements")
    expect(result.sections).toHaveProperty("skills")
    expect(result.sections).toHaveProperty("education")
    expect(result.sections).toHaveProperty("keywords")
    expect(result.sections).toHaveProperty("formatting")
  })
})

describe("computeATSScore — empty/incomplete resume", () => {
  it("scores below 30 for an empty resume", () => {
    const result = computeATSScore({
      contact: emptyContact,
      summary: "",
      experience: [],
      education: [],
      skills: { all: [], technical: [], soft: [], tools: [], languages: [] },
    })
    expect(result.total).toBeLessThan(30)
    expect(result.grade).toMatch(/[DF]/)
    expect(result.missing.length).toBeGreaterThan(0)
  })

  it("includes missing field labels", () => {
    const result = computeATSScore({
      contact: emptyContact,
      summary: "",
      experience: [],
      education: [],
      skills: { all: [], technical: [], soft: [], tools: [], languages: [] },
    })
    expect(result.missing).toContain("Full name")
    expect(result.missing).toContain("Email address")
    expect(result.missing).toContain("Professional summary")
    expect(result.missing).toContain("Work experience")
  })

  it("generates high-priority suggestions for critical missing sections", () => {
    const result = computeATSScore({
      contact: emptyContact,
      summary: "",
      experience: [],
      education: [],
      skills: { all: [], technical: [], soft: [], tools: [], languages: [] },
    })
    const highPriority = result.suggestions.filter((s) => s.priority === "high")
    expect(highPriority.length).toBeGreaterThanOrEqual(2)
  })
})

describe("computeATSScore — job match mode", () => {
  it("activates job match mode when job description provided", () => {
    const result = computeATSScore({
      contact: fullContact,
      summary: "TypeScript developer with React and Node.js expertise",
      experience: strongExperience,
      education: fullEducation,
      skills: richSkills,
      jobDescription: "Looking for TypeScript engineer with React and Node.js experience",
    })
    expect(result.jobMatchMode).toBe(true)
    expect(result.sections.keywords.label).toBe("Job Keyword Match")
  })

  it("gives higher keyword score for matching job description", () => {
    const highMatch = computeATSScore({
      contact: fullContact,
      summary: "TypeScript React Node.js PostgreSQL Redis engineer",
      experience: strongExperience,
      education: fullEducation,
      skills: richSkills,
      jobDescription: "TypeScript React Node.js PostgreSQL Redis engineer needed",
    })
    const lowMatch = computeATSScore({
      contact: fullContact,
      summary: "Professional with skills",
      experience: [],
      education: [],
      skills: thinSkills,
      jobDescription: "TypeScript React Node.js PostgreSQL Redis engineer needed",
    })
    expect(highMatch.sections.keywords.score).toBeGreaterThan(lowMatch.sections.keywords.score)
  })
})

describe("computeATSScore — template safety", () => {
  it("penalises risky creative template for US market", () => {
    const creative = computeATSScore({
      contact: fullContact,
      summary: "Strong summary",
      experience: strongExperience,
      education: fullEducation,
      skills: richSkills,
      templateId: "creative",
      targetCountry: "US",
    })
    const minimal = computeATSScore({
      contact: fullContact,
      summary: "Strong summary",
      experience: strongExperience,
      education: fullEducation,
      skills: richSkills,
      templateId: "minimal",
      targetCountry: "US",
    })
    expect(creative.sections.formatting.score).toBeLessThan(minimal.sections.formatting.score)
    expect(creative.safetyLevel).not.toBe("high")
  })
})

describe("computeATSScore — scoring bounds", () => {
  it("never exceeds 100 total", () => {
    const result = computeATSScore({
      contact: fullContact,
      summary: "Perfect professional summary for a software engineer with 10 years of experience building large-scale systems.",
      experience: strongExperience,
      education: fullEducation,
      skills: richSkills,
    })
    expect(result.total).toBeLessThanOrEqual(100)
    expect(result.maxTotal).toBe(100)
  })

  it("never goes below 0", () => {
    const result = computeATSScore({
      contact: emptyContact,
      summary: "",
      experience: [],
      education: [],
      skills: { all: [], technical: [], soft: [], tools: [], languages: [] },
      templateId: "creative",
      targetCountry: "US",
    })
    expect(result.total).toBeGreaterThanOrEqual(0)
  })
})
