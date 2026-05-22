"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { canUseAI } from "@/lib/access"

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? ""
const AI_MODEL = "gpt-4o-mini"
const aiEnabled =
  OPENAI_KEY !== "" && OPENAI_KEY !== "sk-dummy" && OPENAI_KEY.startsWith("sk-")

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  isEstimated: boolean
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// ── OpenAI call ───────────────────────────────────────────────────────────────

async function callOpenAI(
  messages: ChatMessage[],
  maxTokens = 500,
  attempt = 1
): Promise<{ content: string; usage: TokenUsage }> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (res.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 1000 * attempt))
    return callOpenAI(messages, maxTokens, attempt + 1)
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${err}`)
  }

  const data = (await res.json()) as OpenAIResponse
  const content = data.choices[0]?.message?.content ?? ""

  // Use actual token counts from the API response; fall back to estimates only
  // if the field is absent (some proxies strip it).
  const usage: TokenUsage = data.usage
    ? {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        isEstimated: false,
      }
    : {
        inputTokens: Math.ceil(maxTokens * 0.6),
        outputTokens: Math.ceil(maxTokens * 0.4),
        totalTokens: maxTokens,
        isEstimated: true,
      }

  return { content, usage }
}

// ── Credit guard ──────────────────────────────────────────────────────────────

async function requireAIAccess(userId: string) {
  const check = await canUseAI(userId)
  if (!check.allowed) throw new Error(check.reason ?? "AI limit reached")
}

async function logUsage(
  userId: string,
  action: string,
  usage: TokenUsage
) {
  await prisma.aIUsageLog.create({
    data: {
      userId,
      action,
      tokens: usage.totalTokens,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      isEstimated: usage.isEstimated,
      provider: "openai",
      model: AI_MODEL,
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

  const { content, usage } = await callOpenAI(
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

  await logUsage(session.user.id, "GENERATE_SUMMARY", usage)
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
    return bullet
  }

  const { content, usage } = await callOpenAI(
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

  await logUsage(session.user.id, "REWRITE_BULLET", usage)
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

  const { content, usage } = await callOpenAI(
    [
      {
        role: "system",
        content: `You are a professional translator specializing in resume and CV translation into ${targetName}. Preserve all formatting, structure, and professional terminology.`,
      },
      { role: "user", content: text },
    ],
    800
  )

  await logUsage(session.user.id, "TRANSLATE", usage)
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

  const { content, usage } = await callOpenAI(
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

  await logUsage(session.user.id, "ATS_OPTIMIZE", usage)

  try {
    // Strip markdown code fences GPT sometimes wraps around JSON
    const jsonStr = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    const parsed = JSON.parse(jsonStr) as { score: number; suggestions: string[] }
    return parsed
  } catch {
    return { score: 70, suggestions: ["Unable to parse AI response. Try again."] }
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

  if (!aiEnabled) {
    const techPart = technologies ? ` using ${technologies}` : ""
    const rolePart = role ? `, serving as ${role}` : ""
    return `${title ? `${title}: ` : ""}Built and delivered a production-grade solution${techPart}${rolePart}. Focused on system design, performance optimization, and cross-functional collaboration to achieve measurable impact.`
  }

  const { content, usage } = await callOpenAI(
    [
      {
        role: "system",
        content:
          "You are a professional resume writer specializing in portfolio and project descriptions. Write concise, impact-focused, ATS-friendly project descriptions with measurable outcomes.",
      },
      {
        role: "user",
        content: `Write a compelling project description for a resume/portfolio.\n\nProject: ${title}\nRole: ${role || "Contributor"}\nTechnologies: ${technologies || "Not specified"}\n\nRequirements:\n- 2-3 sentences max\n- Start with an action verb\n- Include technologies naturally\n- Quantify impact if possible\n- ATS-keyword optimized\n- Output language code: ${lang}`,
      },
    ],
    150
  )

  await logUsage(session.user.id, "GENERATE_PROJECT_DESC", usage)
  return content.trim()
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

  if (!aiEnabled) {
    const topSkills = skills.slice(0, 5).join(" · ") || "Strategic thinking · Leadership · Problem-solving"
    return `${jobTitle} | Passionate about delivering results and driving innovation.\n\n${summary || "Experienced professional with a track record of success."}\n\nCore competencies: ${topSkills}\n\nOpen to new opportunities. Let's connect!`
  }

  const { content, usage } = await callOpenAI(
    [
      {
        role: "system",
        content:
          "You are a personal branding expert who writes compelling LinkedIn bios that attract recruiters and opportunities.",
      },
      {
        role: "user",
        content: `Write a LinkedIn About section bio for:\nName: ${name}\nRole: ${jobTitle}\nSummary: ${summary}\nTop Skills: ${skills.slice(0, 8).join(", ")}\n\nRequirements:\n- 150-200 words\n- Engaging, first-person voice\n- Highlights value proposition\n- Ends with a clear CTA\n- Language: ${lang}`,
      },
    ],
    300
  )

  await logUsage(session.user.id, "GENERATE_LINKEDIN_BIO", usage)
  return content.trim()
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
    return `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${jobTitle} position at ${company}. With my professional background and demonstrated expertise, I am confident I would be a valuable addition to your team and contribute meaningfully from day one.\n\n${resumeSummary ? resumeSummary + "\n\n" : ""}I would welcome the opportunity to discuss how my skills and experience align with your needs. Thank you for your time and consideration.\n\nSincerely,\n[Your Name]`
  }

  const { content, usage } = await callOpenAI(
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

  await logUsage(session.user.id, "COVER_LETTER", usage)
  return content
}
