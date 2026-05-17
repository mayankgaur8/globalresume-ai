import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { parseResume } from "@/lib/resume-parser"

export const runtime = "nodejs"
export const maxDuration = 30

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/rtf",
  "application/rtf",
  "text/html",
])

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // Validate type
  if (!ALLOWED_TYPES.has(file.type) && !file.name.match(/\.(pdf|docx?|txt|rtf|html?)$/i)) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload PDF, DOCX, TXT, RTF, or HTML." },
      { status: 415 }
    )
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10 MB." },
      { status: 413 }
    )
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const parsed = await parseResume(buffer, file.type, file.name)

    return NextResponse.json({ success: true, data: parsed })
  } catch (err) {
    console.error("[resume-import] parse error:", err)
    return NextResponse.json(
      { error: "Failed to parse resume. Please try a different file format." },
      { status: 422 }
    )
  }
}
