import path from "path"

export interface ExtractedText {
  text: string
  pageCount: number
  fileType: string
  warning?: string
}

export async function extractText(buffer: Buffer, mimeType: string, filename: string): Promise<ExtractedText> {
  const ext = path.extname(filename).toLowerCase()
  const isDev = process.env.NODE_ENV === "development"

  if (isDev) {
    console.log(`[text-extractor] file="${filename}" size=${buffer.length} mime="${mimeType}" ext="${ext}"`)
  }

  if (mimeType === "application/pdf" || ext === ".pdf") {
    return extractFromPdf(buffer, isDev)
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    ext === ".docx" ||
    ext === ".doc"
  ) {
    return extractFromDocx(buffer, isDev)
  }
  if (mimeType === "text/plain" || ext === ".txt") {
    const text = buffer.toString("utf-8")
    if (isDev) console.log(`[text-extractor] txt: ${text.length} chars`)
    return { text, pageCount: 1, fileType: "txt" }
  }
  if (mimeType === "text/rtf" || mimeType === "application/rtf" || ext === ".rtf") {
    return extractFromRtf(buffer, isDev)
  }
  if (mimeType === "text/html" || ext === ".html" || ext === ".htm") {
    return extractFromHtml(buffer, isDev)
  }

  // Fallback: try to decode as text
  const text = buffer.toString("utf-8")
  if (isDev) console.log(`[text-extractor] unknown type fallback: ${text.length} chars`)
  return { text, pageCount: 1, fileType: "unknown" }
}

async function extractFromPdf(buffer: Buffer, isDev: boolean): Promise<ExtractedText> {
  try {
    // pdf-parse v2.x uses a class-based API: new PDFParse({ data }) → .getText()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = (await import("pdf-parse")) as any
    const PDFParse = pdfParseModule.PDFParse ?? pdfParseModule.default?.PDFParse

    if (typeof PDFParse !== "function") {
      throw new Error(`PDFParse constructor not found. Module keys: ${Object.keys(pdfParseModule).join(", ")}`)
    }

    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    const text: string = result?.text ?? ""
    const pageCount: number = result?.total ?? 1

    if (isDev) console.log(`[text-extractor] pdf: ${pageCount} pages, ${text.length} chars extracted`)

    if (!text || text.trim().length < 20) {
      return {
        text: "",
        pageCount,
        fileType: "pdf",
        warning: "scanned",
      }
    }

    return { text, pageCount, fileType: "pdf" }
  } catch (err) {
    if (isDev) console.error("[text-extractor] pdf parse error:", err)
    return {
      text: "",
      pageCount: 1,
      fileType: "pdf",
      warning: `pdf_error:${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

async function extractFromDocx(buffer: Buffer, isDev: boolean): Promise<ExtractedText> {
  try {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value ?? ""
    if (isDev) console.log(`[text-extractor] docx: ${text.length} chars`)
    if (!text.trim()) {
      return { text: "", pageCount: 1, fileType: "docx", warning: "empty_docx" }
    }
    return { text, pageCount: 1, fileType: "docx" }
  } catch (err) {
    if (isDev) console.error("[text-extractor] docx parse error:", err)
    return {
      text: "",
      pageCount: 1,
      fileType: "docx",
      warning: `docx_error:${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

function extractFromRtf(buffer: Buffer, isDev: boolean): ExtractedText {
  const rtf = buffer.toString("utf-8")
  const text = rtf
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/\\[a-z]+[-]?\d*[ ]?/gi, "")
    .replace(/[{}\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  if (isDev) console.log(`[text-extractor] rtf: ${text.length} chars`)
  return { text, pageCount: 1, fileType: "rtf" }
}

function extractFromHtml(buffer: Buffer, isDev: boolean): ExtractedText {
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
  if (isDev) console.log(`[text-extractor] html: ${text.length} chars`)
  return { text, pageCount: 1, fileType: "html" }
}
