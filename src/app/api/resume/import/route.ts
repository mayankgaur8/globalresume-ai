import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { parseResume, parseResumeFromText } from "@/lib/resume-parser"

export const runtime = "nodejs"
export const maxDuration = 30

const isDev = process.env.NODE_ENV === "development"

const ALLOWED_EXTENSIONS = /\.(pdf|docx?|txt|rtf|html?)$/i
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/rtf",
  "application/rtf",
  "text/html",
  // Some browsers send these for DOCX
  "application/zip",
  "application/octet-stream",
])

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

function fail(message: string, errorCode: string, status: number, details?: string) {
  return NextResponse.json(
    { success: false, errorCode, message, details: isDev ? details : undefined, recoverable: true },
    { status }
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return fail("Authentication required", "UNAUTHORIZED", 401)
  }

  // ── Handle text paste flow ──
  const contentType = req.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    let body: { text?: string }
    try {
      body = await req.json()
    } catch {
      return fail("Invalid JSON body", "BAD_REQUEST", 400)
    }
    if (!body.text?.trim()) {
      return fail("No text provided", "MISSING_TEXT", 400)
    }
    const parsed = parseResumeFromText(body.text)
    return NextResponse.json({
      success: true,
      importId: `paste_${Date.now()}`,
      parsedData: parsed,
      atsScore: parsed.ats.score,
      missingFields: parsed.ats.missing,
      suggestions: parsed.ats.suggestions,
      confidence: parsed.confidence,
    })
  }

  // ── Handle file upload flow ──
  let formData: FormData
  try {
    formData = await req.formData()
  } catch (err) {
    if (isDev) console.error("[import] formData parse error:", err)
    return fail("Could not read uploaded file", "FORM_PARSE_ERROR", 400,
      err instanceof Error ? err.stack : String(err))
  }

  const file = formData.get("file") as File | null
  if (!file || !(file instanceof File)) {
    if (isDev) {
      const keys = [...formData.keys()]
      console.log("[import] FormData keys:", keys)
    }
    return fail("No file provided. Expected field name: 'file'", "MISSING_FILE", 400)
  }

  const ext = (file.name.match(/\.[^.]+$/) ?? [""])[0].toLowerCase()
  const mime = file.type || "application/octet-stream"
  const size = file.size

  if (isDev) {
    console.log(`[import] received: name="${file.name}" mime="${mime}" ext="${ext}" size=${size}`)
  }

  // Validate extension (more reliable than MIME type)
  if (!ALLOWED_EXTENSIONS.test(file.name) && !ALLOWED_MIME_TYPES.has(mime)) {
    return fail(
      `Unsupported file type "${ext || mime}". Please upload PDF, DOCX, DOC, TXT, RTF, or HTML.`,
      "UNSUPPORTED_TYPE",
      415,
      `name="${file.name}" mime="${mime}"`
    )
  }

  if (size === 0) {
    return fail("The uploaded file is empty", "EMPTY_FILE", 400)
  }

  if (size > MAX_SIZE) {
    return fail(
      `File is too large (${(size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`,
      "FILE_TOO_LARGE",
      413
    )
  }

  let buffer: Buffer
  try {
    const ab = await file.arrayBuffer()
    buffer = Buffer.from(ab)
  } catch (err) {
    if (isDev) console.error("[import] buffer conversion error:", err)
    return fail("Could not read file contents", "BUFFER_ERROR", 500,
      err instanceof Error ? err.stack : String(err))
  }

  let parsed
  try {
    parsed = await parseResume(buffer, mime, file.name)
  } catch (err) {
    if (isDev) console.error("[import] parser threw unexpectedly:", err)
    return fail(
      "Parsing failed. This file format may not be supported or the file may be corrupted.",
      "PARSE_ERROR",
      422,
      err instanceof Error ? err.stack : String(err)
    )
  }

  if (isDev) {
    console.log(`[import] parse complete: warning="${parsed.warning ?? "none"}" chars=${parsed.rawText.length} confidence=${parsed.confidence.overall}%`)
  }

  // Successful parse — even partial (empty text is allowed, frontend shows recovery UI)
  return NextResponse.json({
    success: true,
    importId: `file_${Date.now()}`,
    parsedData: parsed,
    atsScore: parsed.ats.score,
    missingFields: parsed.ats.missing,
    suggestions: parsed.ats.suggestions,
    confidence: parsed.confidence,
  })
}
