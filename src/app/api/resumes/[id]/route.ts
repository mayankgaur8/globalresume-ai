import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: { sections: { orderBy: { order: "asc" } } },
  })

  if (!resume) return new NextResponse("Not found", { status: 404 })
  if (resume.userId !== session.user.id && session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  return NextResponse.json(resume)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const body = await req.json()

  const resume = await prisma.resume.findUnique({ where: { id } })
  if (!resume) return new NextResponse("Not found", { status: 404 })
  if (resume.userId !== session.user.id && session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { title, languageCode, templateId, targetCountry, sections } = body as {
    title?: string
    languageCode?: string
    templateId?: string
    targetCountry?: string
    sections?: Array<{ id?: string; type: string; content: unknown; order: number }>
  }

  await prisma.resume.update({
    where: { id },
    data: {
      ...(title      && { title }),
      ...(languageCode && { languageCode }),
      ...(templateId && { templateId }),
      ...(targetCountry && { targetCountry }),
    },
  })

  // Upsert sections. Prefer matching by (resumeId + type) so autosave works even
  // when sections lack an id (builder sends them by type only).
  if (sections && Array.isArray(sections)) {
    const existing = await prisma.resumeSection.findMany({ where: { resumeId: id } })
    const existingByType = Object.fromEntries(existing.map((s) => [s.type, s]))

    for (const section of sections) {
      const content = section.content as object

      if (section.id) {
        // Caller supplied an explicit section id — use it
        await prisma.resumeSection.upsert({
          where: { id: section.id },
          update: { content, order: section.order },
          create: { id: section.id, resumeId: id, type: section.type, content, order: section.order },
        })
      } else if (existingByType[section.type]) {
        // Match by type
        await prisma.resumeSection.update({
          where: { id: existingByType[section.type].id },
          data: { content, order: section.order },
        })
      } else {
        // New section type — create
        await prisma.resumeSection.create({
          data: { resumeId: id, type: section.type, content, order: section.order },
        })
      }
    }
  }

  const result = await prisma.resume.findUnique({
    where: { id },
    include: { sections: { orderBy: { order: "asc" } } },
  })

  return NextResponse.json(result)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params

  const resume = await prisma.resume.findUnique({ where: { id } })
  if (!resume) return new NextResponse("Not found", { status: 404 })
  if (resume.userId !== session.user.id && session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  await prisma.resume.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
