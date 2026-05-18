import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUserPlanLimits } from "@/lib/access"
import { rateLimit } from "@/lib/rate-limit"
import { buildResumePDF } from "@/lib/export/resume-pdf"
import type { ResumeData } from "@/store/useResumeStore"

export const runtime = "nodejs"
export const maxDuration = 30

const isDev = process.env.NODE_ENV !== "production"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Rate-limit: 20 PDF exports per hour
    const rl = rateLimit(`pdf-export:${session.user.id}`, 20, 60 * 60 * 1000)
    if (!rl.success) {
      return new NextResponse("Too many export requests. Please wait a moment.", { status: 429 })
    }

    const limits = await getUserPlanLimits(session.user.id)
    const showWatermark = limits.hasWatermark ?? true

    let parsed: { resumeData?: ResumeData }
    try {
      parsed = await req.json() as { resumeData?: ResumeData }
    } catch {
      return new NextResponse("Invalid request body", { status: 400 })
    }

    const { resumeData } = parsed
    if (!resumeData) {
      return new NextResponse("Missing resumeData", { status: 400 })
    }

    // Guard against oversized payloads (photos can be large base64 strings)
    const rawSize = JSON.stringify(resumeData).length
    if (rawSize > 12 * 1024 * 1024) {
      return new NextResponse("Resume data too large. Remove embedded photos and try again.", { status: 413 })
    }

    if (isDev) console.time("[pdf] renderToBuffer")
    const pdfBuffer = await buildResumePDF(resumeData, showWatermark, limits.plan ?? "FREE")
    if (isDev) {
      console.timeEnd("[pdf] renderToBuffer")
      console.log(`[pdf] buffer size: ${pdfBuffer.length} bytes`)
    }

    if (!pdfBuffer || pdfBuffer.length < 512) {
      throw new Error(`PDF generation produced empty output (${pdfBuffer?.length ?? 0} bytes)`)
    }

    const firstName = resumeData.contact?.firstName ?? ""
    const lastName  = resumeData.contact?.lastName  ?? ""
    const namePart  = [firstName, lastName].filter(Boolean).join("_") || "Resume"
    const filename  = `${namePart}_Resume.pdf`
      .replace(/[^a-zA-Z0-9_.\-]/g, "_")
      .replace(/_+/g, "_")

    // Slice produces a plain ArrayBuffer (not SharedArrayBuffer) — satisfies BlobPart
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    ) as ArrayBuffer
    const blob = new Blob([arrayBuffer], { type: "application/pdf" })

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store",
        "X-PDF-Size": String(pdfBuffer.length),
        "X-Watermark": String(showWatermark),
      },
    })
  } catch (err) {
    console.error("[POST /api/resumes/pdf]", err)
    return new NextResponse(
      isDev ? `PDF generation failed: ${String(err)}` : "PDF generation failed. Please try again.",
      { status: 500 }
    )
  }
}
