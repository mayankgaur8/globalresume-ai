"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { canUseAI } from "@/lib/access"
import {
  getAIProvider,
  sanitize,
  parseATSOutput,
  validateTextOutput,
  validateBulletOutput,
  type TokenUsage,
} from "@/lib/ai"

// ── Credit guard ──────────────────────────────────────────────────────────────

async function requireAIAccess(userId: string) {
  const check = await canUseAI(userId)
  if (!check.allowed) throw new Error(check.reason ?? "AI limit reached")
}

async function logUsage(userId: string, action: string, usage: TokenUsage, model: string) {
  await prisma.aIUsageLog.create({
    data: {
      userId,
      action,
      tokens: usage.totalTokens,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      isEstimated: usage.isEstimated,
      provider: "openai",
      model,
    },
  })
}

// ── Public actions ─────────────────────────────────────────────────────────────

export async function generateSummary(
  jobTitle: string,
  experienceText: string,
  language = "en"
): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await requireAIAccess(session.user.id)

  const langLabel: Record<string, string> = {
    de: "German", fr: "French", es: "Spanish", pt: "Portuguese",
    ja: "Japanese", zh: "Chinese (Simplified)", it: "Italian",
  }
  const targetLang = langLabel[language] ?? "English"
  const ai = getAIProvider()

  // Fallback content is returned by MockAIProvider in dev; real AI in prod
  const { content, usage } = await ai.complete(
    [
      {
        role: "system",
        content: "You are an expert resume writer and career coach who specializes in ATS-optimized resumes. Write concise, impactful professional summaries that highlight key strengths.",
      },
      {
        role: "user",
        content: `Write a professional summary for a ${sanitize(jobTitle, "jobTitle")}.\n\nExperience context: ${sanitize(experienceText, "experienceText") || "(no details provided)"}\n\nRequirements:\n- 3-4 sentences\n- ATS-keyword rich\n- Results-focused\n- Output language: ${targetLang}`,
      },
    ],
    { maxTokens: 200 }
  )

  await logUsage(session.user.id, "GENERATE_SUMMARY", usage, ai.model)
  return validateTextOutput(content)
}

export async function rewriteBullet(
  bullet: string,
  jobTitle: string,
  language = "en"
): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await requireAIAccess(session.user.id)

  const ai = getAIProvider()
  const { content, usage } = await ai.complete(
    [
      {
        role: "system",
        content: "You are a professional resume writer. Rewrite bullet points to be more impactful, action-verb-led, and quantified where possible. Keep it to one sentence.",
      },
      {
        role: "user",
        content: `Rewrite this resume bullet point for a ${sanitize(jobTitle, "jobTitle")} role. Output language: ${language}.\n\nOriginal: ${sanitize(bullet, "bullet")}`,
      },
    ],
    { maxTokens: 100 }
  )

  await logUsage(session.user.id, "REWRITE_BULLET", usage, ai.model)
  return validateBulletOutput(content)
}

export async function translateContent(
  text: string,
  targetLanguage: string
): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await requireAIAccess(session.user.id)

  const langNames: Record<string, string> = {
    de: "German", fr: "French", es: "Spanish", pt: "Portuguese",
    ja: "Japanese", zh: "Chinese (Simplified)", it: "Italian",
    nl: "Dutch", sv: "Swedish",
  }
  const targetName = langNames[targetLanguage] ?? targetLanguage
  const ai = getAIProvider()

  const { content, usage } = await ai.complete(
    [
      {
        role: "system",
        content: `You are a professional translator specializing in resume and CV translation into ${targetName}. Preserve all formatting, structure, and professional terminology.`,
      },
      { role: "user", content: sanitize(text, "text") },
    ],
    { maxTokens: 800 }
  )

  await logUsage(session.user.id, "TRANSLATE", usage, ai.model)
  return validateTextOutput(content)
}

export async function optimizeForATS(
  resumeText: string,
  jobDescription: string
): Promise<{ score: number; suggestions: string[] }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await requireAIAccess(session.user.id)

  const ai = getAIProvider()
  const { content, usage } = await ai.complete(
    [
      {
        role: "system",
        content: "You are an ATS (Applicant Tracking System) expert. Analyze a resume against a job description and return a JSON object with a score (0-100) and an array of improvement suggestions.",
      },
      {
        role: "user",
        content: `Analyze this resume for ATS compatibility with the given job description.\n\nResume:\n${sanitize(resumeText, "resumeText")}\n\nJob Description:\n${sanitize(jobDescription, "jobDescription")}\n\nReturn ONLY valid JSON in this format: {"score": 85, "suggestions": ["...", "..."]}`,
      },
    ],
    { maxTokens: 400 }
  )

  await logUsage(session.user.id, "ATS_OPTIMIZE", usage, ai.model)

  try {
    return parseATSOutput(content)
  } catch {
    return { score: 70, suggestions: ["Unable to parse AI analysis. Try again."] }
  }
}

export async function generateProjectDescription(
  title: string,
  role: string,
  technologies: string,
  lang = "en"
): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await requireAIAccess(session.user.id)

  const ai = getAIProvider()
  const { content, usage } = await ai.complete(
    [
      {
        role: "system",
        content: "You are a professional resume writer specializing in portfolio and project descriptions. Write concise, impact-focused, ATS-friendly project descriptions with measurable outcomes.",
      },
      {
        role: "user",
        content: `Write a compelling project description for a resume/portfolio.\n\nProject: ${sanitize(title, "jobTitle")}\nRole: ${sanitize(role || "Contributor", "jobTitle")}\nTechnologies: ${sanitize(technologies || "Not specified", "technologies")}\n\nRequirements:\n- 2-3 sentences max\n- Start with an action verb\n- Include technologies naturally\n- Quantify impact if possible\n- ATS-keyword optimized\n- Output language code: ${lang}`,
      },
    ],
    { maxTokens: 150 }
  )

  await logUsage(session.user.id, "GENERATE_PROJECT_DESC", usage, ai.model)
  return validateTextOutput(content)
}

export async function generateLinkedInBio(
  name: string,
  jobTitle: string,
  summary: string,
  skills: string[],
  lang = "en"
): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await requireAIAccess(session.user.id)

  const ai = getAIProvider()
  const { content, usage } = await ai.complete(
    [
      {
        role: "system",
        content: "You are a personal branding expert who writes compelling LinkedIn bios that attract recruiters and opportunities.",
      },
      {
        role: "user",
        content: `Write a LinkedIn About section bio for:\nName: ${sanitize(name, "name")}\nRole: ${sanitize(jobTitle, "jobTitle")}\nSummary: ${sanitize(summary, "summary")}\nTop Skills: ${skills.slice(0, 8).join(", ").slice(0, 300)}\n\nRequirements:\n- 150-200 words\n- Engaging, first-person voice\n- Highlights value proposition\n- Ends with a clear CTA\n- Language: ${lang}`,
      },
    ],
    { maxTokens: 300 }
  )

  await logUsage(session.user.id, "GENERATE_LINKEDIN_BIO", usage, ai.model)
  return validateTextOutput(content)
}

export async function generateCoverLetter(
  jobTitle: string,
  company: string,
  resumeSummary: string,
  language = "en"
): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await requireAIAccess(session.user.id)

  const ai = getAIProvider()
  const { content, usage } = await ai.complete(
    [
      {
        role: "system",
        content: "You are a professional career coach who writes compelling, personalized cover letters that get interviews.",
      },
      {
        role: "user",
        content: `Write a professional cover letter for a ${sanitize(jobTitle, "jobTitle")} position at ${sanitize(company, "company")}.\n\nCandidate background: ${sanitize(resumeSummary, "summary")}\n\nRequirements:\n- 3 short paragraphs\n- Professional and enthusiastic tone\n- Specific to the company and role\n- End with a clear call to action\n- Output language code: ${language}`,
      },
    ],
    { maxTokens: 600 }
  )

  await logUsage(session.user.id, "COVER_LETTER", usage, ai.model)
  return validateTextOutput(content)
}
