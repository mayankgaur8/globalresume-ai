import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUserPlanLimits } from "@/lib/access"

// PDF generation via @react-pdf/renderer requires a server-side render context.
// We produce a simple HTML → text fallback here and indicate watermark status.
// For production, swap this route body with react-pdf's renderToBuffer().

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const limits = await getUserPlanLimits(session.user.id)
  const { resumeData } = await req.json()

  // Build plain-text resume content (used as fallback / placeholder)
  const contact = resumeData?.contact || {}
  const lines: string[] = []

  lines.push(`${contact.firstName || ""} ${contact.lastName || ""}`.trim())
  if (contact.email) lines.push(contact.email)
  if (contact.phone) lines.push(contact.phone)
  if (contact.city) lines.push(`${contact.city}${contact.country ? `, ${contact.country}` : ""}`)
  lines.push("")

  if (resumeData?.summary) {
    lines.push("PROFESSIONAL SUMMARY")
    lines.push(resumeData.summary)
    lines.push("")
  }

  if (resumeData?.experience?.length) {
    lines.push("WORK EXPERIENCE")
    for (const exp of resumeData.experience) {
      lines.push(`${exp.position} at ${exp.company}`)
      lines.push(`${exp.startDate || ""} – ${exp.current ? "Present" : exp.endDate || ""}`)
      if (exp.description) lines.push(exp.description)
      lines.push("")
    }
  }

  if (resumeData?.education?.length) {
    lines.push("EDUCATION")
    for (const edu of resumeData.education) {
      lines.push(`${edu.degree} in ${edu.field} – ${edu.institution}`)
    }
    lines.push("")
  }

  if (resumeData?.skills?.length) {
    lines.push("SKILLS")
    lines.push(resumeData.skills.map((s: { name: string }) => s.name).join(", "))
    lines.push("")
  }

  if (limits.hasWatermark) {
    lines.push("")
    lines.push("--- Generated with GlobalResumeAI Free Plan (watermark) ---")
    lines.push("Upgrade to remove watermark: https://globalresumeai.com/dashboard/billing")
  }

  const textContent = lines.join("\n")

  return new NextResponse(textContent, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${resumeData?.title || "resume"}.txt"`,
    },
  })
}
