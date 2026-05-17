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
  "application/zip",
  "application/octet-stream",
])

const MAX_SIZE = 10 * 1024 * 1024

function fail(message: string, errorCode: string, status: number, details?: string) {
  return NextResponse.json(
    { success: false, errorCode, message, details: isDev ? details : undefined, recoverable: true },
    { status }
  )
}

function ok(parsed: ReturnType<typeof parseResumeFromText>) {
  return NextResponse.json({
    success: true,
    importId: `import_${Date.now()}`,
    parsedData: parsed,
    atsScore: parsed.ats.total,
    atsGrade: parsed.ats.grade,
    missingFields: parsed.ats.missing,
    suggestions: parsed.ats.suggestions,
    confidence: parsed.confidence,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return fail("Authentication required", "UNAUTHORIZED", 401)

  const contentType = req.headers.get("content-type") ?? ""

  // ── JSON / paste flow ──
  if (contentType.includes("application/json")) {
    let body: { text?: string; jobDescription?: string; templateId?: string; targetCountry?: string }
    try { body = await req.json() }
    catch { return fail("Invalid JSON body", "BAD_REQUEST", 400) }

    if (!body.text?.trim()) return fail("No text provided", "MISSING_TEXT", 400)

    const parsed = parseResumeFromText(body.text, {
      jobDescription: body.jobDescription,
      templateId: body.templateId,
      targetCountry: body.targetCountry,
    })
    return ok(parsed)
  }

  // ── Multipart / file upload flow ──
  let formData: FormData
  try { formData = await req.formData() }
  catch (err) {
    if (isDev) console.error("[import] formData error:", err)
    return fail("Could not read uploaded file", "FORM_PARSE_ERROR", 400, String(err))
  }

  const file = formData.get("file") as File | null
  if (!file || !(file instanceof File)) {
    if (isDev) console.log("[import] FormData keys:", [...formData.keys()])
    return fail("No file provided. Expected field name: 'file'", "MISSING_FILE", 400)
  }

  const ext = (file.name.match(/\.[^.]+$/) ?? [""])[0].toLowerCase()
  const mime = file.type || "application/octet-stream"
  const size = file.size
  const jobDescription = (formData.get("jobDescription") as string) || undefined
  const templateId = (formData.get("templateId") as string) || undefined
  const targetCountry = (formData.get("targetCountry") as string) || undefined

  if (isDev) console.log(`[import] name="${file.name}" mime="${mime}" ext="${ext}" size=${size}`)

  if (!ALLOWED_EXTENSIONS.test(file.name) && !ALLOWED_MIME_TYPES.has(mime)) {
    return fail(`Unsupported file type "${ext || mime}". Upload PDF, DOCX, TXT, RTF, or HTML.`, "UNSUPPORTED_TYPE", 415)
  }
  if (size === 0) return fail("The uploaded file is empty", "EMPTY_FILE", 400)
  if (size > MAX_SIZE) {
    return fail(`File too large (${(size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.`, "FILE_TOO_LARGE", 413)
  }

  let buffer: Buffer
  try { buffer = Buffer.from(await file.arrayBuffer()) }
  catch (err) { return fail("Could not read file contents", "BUFFER_ERROR", 500, String(err)) }

  let parsed
  try {
    parsed = await parseResume(buffer, mime, file.name, { jobDescription, templateId, targetCountry })
  } catch (err) {
    if (isDev) console.error("[import] parser threw:", err)
    return fail("Parsing failed. The file may be corrupted or unsupported.", "PARSE_ERROR", 422, String(err))
  }

  if (isDev) console.log(`[import] done: warning="${parsed.warning ?? "none"}" chars=${parsed.rawText.length} ats=${parsed.ats.total}`)

  if (!parsed.rawText.trim() || parsed.warning === "scanned") {
    return fail(
      "Could not extract text. This may be a scanned or image-based PDF.",
      "SCANNED_PDF",
      422
    )
  }

  return ok(parsed)
}
