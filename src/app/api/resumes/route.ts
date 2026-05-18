import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getUserPlanLimits } from "@/lib/access"
import { rateLimit } from "@/lib/rate-limit"

const isDev = process.env.NODE_ENV !== "production"

function apiError(message: string, status: number, code: string, detail?: string) {
  return NextResponse.json(
    {
      success: false,
      errorCode: code,
      message,
      ...(isDev && detail ? { detail } : {}),
    },
    { status }
  )
}

const DEFAULT_SECTIONS = [
  {
    type: "CONTACT",
    content: { firstName: "", lastName: "", email: "", phone: "", address: "", city: "", country: "", linkedin: "", website: "" },
    order: 0,
  },
  { type: "SUMMARY",          content: { text: "" },                           order: 1 },
  { type: "EXPERIENCE",       content: { items: [] },                           order: 2 },
  { type: "EDUCATION",        content: { items: [] },                           order: 3 },
  { type: "SKILLS",           content: { items: [] },                           order: 4 },
  { type: "LANGUAGES",        content: { items: [] },                           order: 5 },
  { type: "CERTIFICATIONS",   content: { items: [] },                           order: 6 },
  { type: "PROJECTS",         content: { items: [] },                           order: 7 },
  { type: "REFERENCES",       content: { text: "Available upon request" },      order: 8 },
  { type: "PORTFOLIO",        content: { tagline: "", links: [], showcases: [] }, order: 9 },
]

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return apiError("Please sign in to view your resumes.", 401, "UNAUTHORIZED")

    const resumes = await prisma.resume.findMany({
      where: { userId: session.user.id },
      include: { sections: { orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(resumes)
  } catch (err) {
    console.error("[GET /api/resumes]", err)
    return apiError("Failed to load resumes.", 500, "SERVER_ERROR", String(err))
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiError("Please sign in to create a resume.", 401, "UNAUTHORIZED")
    }

    const rl = rateLimit(`create-resume:${session.user.id}`, 20, 60 * 60 * 1000)
    if (!rl.success) {
      return apiError("You're creating resumes too quickly. Please wait a minute and try again.", 429, "RATE_LIMITED")
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError("Invalid request format. Please try again.", 400, "INVALID_BODY")
    }

    if (!body || typeof body !== "object") {
      return apiError("Invalid request format. Please try again.", 400, "INVALID_BODY")
    }

    const { title, languageCode, templateId, targetCountry, sections } = body as {
      title?: string
      languageCode?: string
      templateId?: string
      targetCountry?: string
      sections?: Array<{ type: string; content: unknown; order: number }>
    }

    if (!title?.trim()) {
      return apiError("Resume title is required.", 400, "MISSING_TITLE")
    }
    if (!templateId?.trim()) {
      return apiError("Template selection is required.", 400, "MISSING_TEMPLATE")
    }

    // Plan limit check
    let limits
    try {
      limits = await getUserPlanLimits(session.user.id)
    } catch (err) {
      console.error("[POST /api/resumes] getUserPlanLimits failed:", err)
      // Fall back to FREE limits if the plan query fails
      limits = { maxResumes: 3 }
    }

    const count = await prisma.resume.count({ where: { userId: session.user.id } })
    if (count >= limits.maxResumes) {
      return apiError(
        `You've reached the limit of ${limits.maxResumes} resume${limits.maxResumes !== 1 ? "s" : ""} on your current plan. Delete an existing resume or upgrade to create more.`,
        403,
        "RESUME_LIMIT_REACHED"
      )
    }

    // Validate section payload size (guard against huge photo data URLs)
    const rawBody = JSON.stringify(body)
    if (rawBody.length > 10 * 1024 * 1024) {
      return apiError("Resume data is too large. Remove embedded photos and try again.", 413, "PAYLOAD_TOO_LARGE")
    }

    const sectionsToCreate =
      Array.isArray(sections) && sections.length > 0
        ? sections.map((s) => ({
            type: String(s.type),
            content: (s.content ?? {}) as object,
            order: Number(s.order) || 0,
          }))
        : DEFAULT_SECTIONS

    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        title: title.trim().slice(0, 200),
        languageCode: languageCode || "en",
        templateId: templateId.trim(),
        targetCountry: targetCountry?.trim() || "US",
        sections: { create: sectionsToCreate },
      },
      include: { sections: { orderBy: { order: "asc" } } },
    })

    return NextResponse.json(
      { success: true, resume, redirectUrl: `/dashboard/builder/${resume.id}` },
      { status: 201 }
    )
  } catch (err) {
    console.error("[POST /api/resumes]", err)
    return apiError(
      "An unexpected error occurred while creating your resume. Please try again.",
      500,
      "SERVER_ERROR",
      String(err)
    )
  }
}
