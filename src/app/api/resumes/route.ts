import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getUserPlanLimits } from "@/lib/access"
import { rateLimit } from "@/lib/rate-limit"

const DEFAULT_SECTIONS = [
  {
    type: "CONTACT",
    content: { firstName: "", lastName: "", email: "", phone: "", address: "", city: "", country: "", linkedin: "", website: "" },
    order: 0,
  },
  { type: "SUMMARY",      content: { text: "" },   order: 1 },
  { type: "EXPERIENCE",   content: { items: [] },  order: 2 },
  { type: "EDUCATION",    content: { items: [] },  order: 3 },
  { type: "SKILLS",       content: { items: [] },  order: 4 },
  { type: "LANGUAGES",    content: { items: [] },  order: 5 },
  { type: "CERTIFICATIONS", content: { items: [] }, order: 6 },
  { type: "PROJECTS",     content: { items: [] },  order: 7 },
  { type: "REFERENCES",   content: { text: "Available upon request" }, order: 8 },
]

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    include: { sections: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(resumes)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const rl = rateLimit(`create-resume:${session.user.id}`, 20, 60 * 60 * 1000)
  if (!rl.success) return new NextResponse("Too many requests", { status: 429 })

  const body = await req.json().catch(() => null)
  if (!body) return new NextResponse("Invalid request body", { status: 400 })

  const { title, languageCode, templateId, targetCountry, sections } = body as {
    title?: string
    languageCode?: string
    templateId?: string
    targetCountry?: string
    sections?: Array<{ type: string; content: unknown; order: number }>
  }

  if (!title?.trim() || !templateId?.trim()) {
    return new NextResponse("title and templateId are required", { status: 400 })
  }

  const limits = await getUserPlanLimits(session.user.id)
  const count = await prisma.resume.count({ where: { userId: session.user.id } })
  if (count >= limits.maxResumes) {
    return new NextResponse(
      `Your plan allows a maximum of ${limits.maxResumes} resumes. Upgrade to create more.`,
      { status: 403 }
    )
  }

  // When caller provides sections (e.g. from wizard import), use those.
  // Otherwise fall back to blank defaults.
  const sectionsToCreate = sections && sections.length > 0
    ? sections.map((s) => ({ type: s.type, content: s.content as object, order: s.order }))
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

  return NextResponse.json(resume, { status: 201 })
}
