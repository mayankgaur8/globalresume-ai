/**
 * Streaming AI completions endpoint.
 * Accepts a feature name + messages array, streams the response as text/event-stream.
 * Used by the cover letter generator and any long-form AI feature.
 */
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { canUseAI, getUserPlanLimits } from "@/lib/access"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { sanitize } from "@/lib/ai/middleware/sanitize"
import prisma from "@/lib/prisma"
import { z } from "zod"

export const runtime = "nodejs"
export const maxDuration = 30

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? ""
const streamEnabled = OPENAI_KEY !== "" && OPENAI_KEY !== "sk-dummy" && OPENAI_KEY.startsWith("sk-")

const requestSchema = z.object({
  feature: z.enum(["cover_letter", "summary", "bullet", "linkedin_bio", "project_desc"]),
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().max(10_000),
  })).min(1).max(10),
  maxTokens: z.number().int().min(50).max(1000).optional().default(600),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const ip = getClientIp(req)
  const rl = rateLimit(`ai-stream:${session.user.id}:${ip}`, 10, 60_000)
  if (!rl.success) {
    return new NextResponse("Rate limit exceeded", { status: 429 })
  }

  const access = await canUseAI(session.user.id)
  if (!access.allowed) {
    return new NextResponse(access.reason ?? "AI limit reached", { status: 429 })
  }

  let body: z.infer<typeof requestSchema>
  try {
    body = requestSchema.parse(await req.json())
  } catch {
    return new NextResponse("Invalid request body", { status: 400 })
  }

  // Sanitize all user message content
  const messages = body.messages.map((m) => ({
    ...m,
    content: m.role === "user" ? sanitize(m.content, "text") : m.content,
  }))

  if (!streamEnabled) {
    // Dev fallback: return mock content as a complete (non-streaming) response
    const limits = await getUserPlanLimits(session.user.id)
    return NextResponse.json({
      content: `[AI streaming requires OPENAI_API_KEY — plan: ${limits.plan}]`,
      streamed: false,
    })
  }

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: body.maxTokens,
      temperature: 0.7,
      stream: true,
    }),
  })

  if (!upstream.ok) {
    return new NextResponse("AI service error", { status: 502 })
  }

  // Log usage asynchronously — estimate tokens since streaming doesn't return usage counts
  void prisma.aIUsageLog.create({
    data: {
      userId: session.user.id,
      action: body.feature.toUpperCase(),
      tokens: body.maxTokens,
      inputTokens: Math.ceil(body.maxTokens * 0.4),
      outputTokens: Math.ceil(body.maxTokens * 0.6),
      isEstimated: true,
      provider: "openai",
      model: "gpt-4o-mini",
    },
  })

  // Pipe OpenAI SSE directly to the client
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  })
}
