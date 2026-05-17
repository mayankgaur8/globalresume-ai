"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { canUseAI } from "@/lib/access"

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? ""
const aiEnabled =
  OPENAI_KEY !== "" && OPENAI_KEY !== "sk-dummy" && OPENAI_KEY.startsWith("sk-")

// ── OpenAI call with retry ────────────────────────────────────────────────────

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

async function callOpenAI(
  messages: ChatMessage[],
  maxTokens = 500,
  attempt = 1
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (res.status === 429 && attempt < 3) {
    // Retry with exponential backoff on rate limit
    await new Promise((r) => setTimeout(r, 1000 * attempt))
    return callOpenAI(messages, maxTokens, attempt + 1)
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${err}`)
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>
    usage: { total_tokens: number }
  }
  return data.choices[0]?.message?.content ?? ""
}

// ── Credit guard ──────────────────────────────────────────────────────────────

async function requireAIAccess(userId: string) {
  const check = await canUseAI(userId)
  if (!check.allowed) throw new Error(check.reason ?? "AI limit reached")
}

async function logUsage(userId: string, action: string, tokens: number) {
  await prisma.aIUsageLog.create({ data: { userId, action, tokens } })
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

  if (!aiEnabled) {
    return `Professional ${jobTitle} with demonstrated expertise and a strong track record of delivering results. Passionate about contributing to team success and driving meaningful impact through effective collaboration and strategic thinking.`
  }

  const langLabel: Record<string, string> = {
    de: "German",
    fr: "French",
    es: "Spanish",
    pt: "Portuguese",
    ja: "Japanese",
    zh: "Chinese (Simplified)",
    it: "Italian",
  }
  const targetLang = langLabel[language] ?? "English"

  const content = await callOpenAI(
    [
      {
        role: "system",
        content:
          "You are an expert resume writer and career coach who specializes in ATS-optimized resumes. Write concise, impactful professional summaries that highlight key strengths.",
      },
      {
        role: "user",
        content: `Write a professional summary for a ${jobTitle}.\n\nExperience context: ${experienceText || "(no details provided)"}\n\nRequirements:\n- 3-4 sentences\n- ATS-keyword rich\n- Results-focused\n- Output language: ${targetLang}`,
      },
    ],
    200
  )

  await logUsage(session.user.id, "GENERATE_SUMMARY", 150)
  return content
}

export async function rewriteBullet(
  bullet: string,
  jobTitle: string,
  language = "en"
): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await requireAIAccess(session.user.id)

  if (!aiEnabled) {
    return `${bullet} (AI rewrite unavailable — add OPENAI_API_KEY to enable)`
  }

  const content = await callOpenAI(
    [
      {
        role: "system",
        content:
          "You are a professional resume writer. Rewrite bullet points to be more impactful, action-verb-led, and quantified where possible. Keep it to one sentence.",
      },
      {
        role: "user",
        content: `Rewrite this resume bullet point for a ${jobTitle} role. Output language: ${language}.\n\nOriginal: ${bullet}`,
      },
    ],
    100
  )

  await logUsage(session.user.id, "REWRITE_BULLET", 80)
  return content.replace(/^[-•]\s*/, "").trim()
}

export async function translateContent(
  text: string,
  targetLanguage: string
): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await requireAIAccess(session.user.id)

  if (!aiEnabled) {
    throw new Error("AI translation requires OPENAI_API_KEY to be configured.")
  }

  const langNames: Record<string, string> = {
    de: "German",
    fr: "French",
    es: "Spanish",
    pt: "Portuguese",
    ja: "Japanese",
    zh: "Chinese (Simplified)",
    it: "Italian",
    nl: "Dutch",
    sv: "Swedish",
  }
  const targetName = langNames[targetLanguage] ?? targetLanguage

  const content = await callOpenAI(
    [
      {
        role: "system",
        content: `You are a professional translator specializing in resume and CV translation into ${targetName}. Preserve all formatting, structure, and professional terminology.`,
      },
      { role: "user", content: text },
    ],
    800
  )

  await logUsage(session.user.id, "TRANSLATE", 400)
  return content
}

export async function optimizeForATS(
  resumeText: string,
  jobDescription: string
): Promise<{ score: number; suggestions: string[] }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await requireAIAccess(session.user.id)

  if (!aiEnabled) {
    return {
      score: 72,
      suggestions: [
        "Add OpenAI API key to enable real ATS analysis",
        "Include keywords from the job description",
        "Use action verbs to start each bullet point",
        "Quantify achievements with numbers where possible",
      ],
    }
  }

  const content = await callOpenAI(
    [
      {
        role: "system",
        content:
          "You are an ATS (Applicant Tracking System) expert. Analyze a resume against a job description and return a JSON object with a score (0-100) and an array of improvement suggestions.",
      },
      {
        role: "user",
        content: `Analyze this resume for ATS compatibility with the given job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON in this format: {"score": 85, "suggestions": ["...", "..."]}`,
      },
    ],
    400
  )

  await logUsage(session.user.id, "ATS_OPTIMIZE", 300)

  try {
    const parsed = JSON.parse(content) as { score: number; suggestions: string[] }
    return parsed
  } catch {
    return { score: 70, suggestions: ["Unable to parse AI response. Try again."] }
  }
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

  if (!aiEnabled) {
    return `Dear Hiring Manager,\n\nI am writing to express my interest in the ${jobTitle} position at ${company}. With my background and skills, I am confident I would be a valuable addition to your team.\n\n[Add OPENAI_API_KEY to generate a personalized cover letter]\n\nSincerely,\n[Your Name]`
  }

  const content = await callOpenAI(
    [
      {
        role: "system",
        content:
          "You are a professional career coach who writes compelling, personalized cover letters that get interviews.",
      },
      {
        role: "user",
        content: `Write a professional cover letter for a ${jobTitle} position at ${company}.\n\nCandidate background: ${resumeSummary}\n\nRequirements:\n- 3 short paragraphs\n- Professional and enthusiastic tone\n- Specific to the company and role\n- End with a clear call to action\n- Output language code: ${language}`,
      },
    ],
    600
  )

  await logUsage(session.user.id, "COVER_LETTER", 400)
  return content
}
