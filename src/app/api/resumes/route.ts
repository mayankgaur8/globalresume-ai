import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

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

  const body = await req.json()
  const { title, languageCode, templateId, targetCountry } = body

  if (!title || !templateId) {
    return new NextResponse("Missing required fields", { status: 400 })
  }

  const resume = await prisma.resume.create({
    data: {
      userId: session.user.id,
      title,
      languageCode: languageCode || "en",
      templateId,
      targetCountry: targetCountry || "US",
      sections: {
        create: [
          { type: "CONTACT", content: { firstName: "", lastName: "", email: "", phone: "", address: "", city: "", country: "", linkedin: "", website: "" }, order: 0 },
          { type: "SUMMARY", content: { text: "" }, order: 1 },
          { type: "EXPERIENCE", content: { items: [] }, order: 2 },
          { type: "EDUCATION", content: { items: [] }, order: 3 },
          { type: "SKILLS", content: { items: [] }, order: 4 },
        ],
      },
    },
    include: { sections: { orderBy: { order: "asc" } } },
  })

  return NextResponse.json(resume)
}
