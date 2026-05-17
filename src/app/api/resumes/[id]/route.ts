import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { title, languageCode, templateId, targetCountry, sections } = body

  const updated = await prisma.resume.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(languageCode && { languageCode }),
      ...(templateId && { templateId }),
      ...(targetCountry && { targetCountry }),
    },
  })

  // Upsert sections if provided
  if (sections && Array.isArray(sections)) {
    for (const section of sections) {
      if (section.id) {
        await prisma.resumeSection.update({
          where: { id: section.id },
          data: { content: section.content, order: section.order },
        })
      } else {
        await prisma.resumeSection.create({
          data: {
            resumeId: id,
            type: section.type,
            content: section.content,
            order: section.order,
          },
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
