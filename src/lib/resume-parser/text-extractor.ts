import path from "path"

export interface ExtractedText {
  text: string
  pageCount: number
  fileType: string
}

export async function extractText(buffer: Buffer, mimeType: string, filename: string): Promise<ExtractedText> {
  const ext = path.extname(filename).toLowerCase()

  if (mimeType === "application/pdf" || ext === ".pdf") {
    return extractFromPdf(buffer)
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    ext === ".docx" ||
    ext === ".doc"
  ) {
    return extractFromDocx(buffer)
  }
  if (mimeType === "text/plain" || ext === ".txt") {
    return { text: buffer.toString("utf-8"), pageCount: 1, fileType: "txt" }
  }
  if (mimeType === "text/rtf" || ext === ".rtf") {
    return extractFromRtf(buffer)
  }
  if (mimeType === "text/html" || ext === ".html" || ext === ".htm") {
    return extractFromHtml(buffer)
  }

  // Fallback: try to decode as text
  return { text: buffer.toString("utf-8"), pageCount: 1, fileType: "unknown" }
}

async function extractFromPdf(buffer: Buffer): Promise<ExtractedText> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParseModule = (await import("pdf-parse")) as any
  const pdfParse = pdfParseModule.default ?? pdfParseModule
  const data = await pdfParse(buffer)
  return {
    text: data.text,
    pageCount: data.numpages,
    fileType: "pdf",
  }
}

async function extractFromDocx(buffer: Buffer): Promise<ExtractedText> {
  const mammoth = await import("mammoth")
  const result = await mammoth.extractRawText({ buffer })
  return {
    text: result.value,
    pageCount: 1,
    fileType: "docx",
  }
}

function extractFromRtf(buffer: Buffer): ExtractedText {
  const rtf = buffer.toString("utf-8")
  // Strip RTF control words and groups
  const text = rtf
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/\\[a-z]+[-]?\d*[ ]?/gi, "")
    .replace(/[{}\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  return { text, pageCount: 1, fileType: "rtf" }
}

function extractFromHtml(buffer: Buffer): ExtractedText {
  const html = buffer.toString("utf-8")
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
  return { text, pageCount: 1, fileType: "html" }
}
