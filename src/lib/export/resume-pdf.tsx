/**
 * resume-pdf.tsx — Server-side PDF renderer (@react-pdf/renderer)
 *
 * Design principles:
 *  - ALL layout uses explicit dimensions — no flexWrap on headers
 *  - Contact line is a single Text node so it wraps safely
 *  - URLs stripped to bare hostname+path to prevent overflow
 *  - AI debug strings sanitized before rendering
 *  - Font: Helvetica (built-in, zero-latency) for Latin; NotoSans registered
 *    once per process for CJK (graceful fallback on CDN miss)
 *  - Watermark + page numbers via fixed-position Text
 *
 * ONLY called from /api/resumes/pdf/route.ts — never imported in any client module.
 */

import { Document, Page, Text, View, Image, Font, StyleSheet } from "@react-pdf/renderer"
import type { ResumeData } from "@/store/useResumeStore"

// ── Font setup ────────────────────────────────────────────────────────────────

Font.registerHyphenationCallback((word) => [word]) // disable hyphenation — ATS-safe

let cjkRegistered = false
function ensureCJKFont() {
  if (cjkRegistered) return
  cjkRegistered = true
  try {
    Font.register({
      family: "NotoSans",
      fonts: [
        { src: "https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7du3mhPy0.woff2" },
        { src: "https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNr4AwhQ_yu-Jg.woff2", fontWeight: 700 },
      ],
    })
  } catch { /* CDN unreachable — Helvetica fallback handles Latin */ }
}

// ── Accent colours ────────────────────────────────────────────────────────────

const ACCENT: Record<string, string> = {
  modern: "#3B82F6", classic: "#1E3A5F", minimal: "#374151",
  "ats-friendly": "#1E40AF", executive: "#1E293B", creative: "#7C3AED",
  global: "#0F766E", "global-tech": "#0D9488", "consultant-pro": "#D97706",
  academic: "#374151", german: "#DC2626", french: "#1D4ED8",
  japanese: "#9F1239", spanish: "#B45309", portuguese: "#15803D",
  "uae-pro": "#1E3A5F", "euro-card": "#1E3A5F",
}
const accentFor = (t: string) => ACCENT[t] ?? "#3B82F6"

// ── i18n ──────────────────────────────────────────────────────────────────────

const MONTH: Record<string, string[]> = {
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  de: ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],
  fr: ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"],
  es: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
  pt: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
  ja: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
  zh: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
}
const PRESENT: Record<string, string> = {
  en: "Present", de: "Heute", fr: "Aujourd'hui", es: "Actualidad",
  pt: "Atual", ja: "現在", zh: "至今",
}
const HEADS: Record<string, Record<string, string>> = {
  en: { summary:"Professional Summary", experience:"Work Experience", education:"Education", skills:"Skills", projects:"Projects", certifications:"Certifications", languages:"Languages", portfolio:"Portfolio" },
  de: { summary:"Profil", experience:"Berufserfahrung", education:"Ausbildung", skills:"Fähigkeiten", projects:"Projekte", certifications:"Zertifizierungen", languages:"Sprachen", portfolio:"Portfolio" },
  fr: { summary:"Profil", experience:"Expérience professionnelle", education:"Formation", skills:"Compétences", projects:"Projets", certifications:"Certifications", languages:"Langues", portfolio:"Portfolio" },
  es: { summary:"Perfil profesional", experience:"Experiencia laboral", education:"Educación", skills:"Habilidades", projects:"Proyectos", certifications:"Certificaciones", languages:"Idiomas", portfolio:"Portfolio" },
  pt: { summary:"Perfil profissional", experience:"Experiência profissional", education:"Formação", skills:"Competências", projects:"Projetos", certifications:"Certificações", languages:"Idiomas", portfolio:"Portfolio" },
  ja: { summary:"プロフィール", experience:"職務経歴", education:"学歴", skills:"スキル", projects:"プロジェクト", certifications:"資格・認定", languages:"語学", portfolio:"ポートフォリオ" },
  zh: { summary:"个人简介", experience:"工作经历", education:"教育背景", skills:"专业技能", projects:"项目经验", certifications:"证书", languages:"语言能力", portfolio:"作品集" },
}
function h(lang: string, key: string): string {
  return (HEADS[lang] ?? HEADS.en)[key] ?? key
}
function fmtDate(raw: string, lang: string): string {
  if (!raw) return ""
  const months = MONTH[lang] ?? MONTH.en
  if (/^\d{4}$/.test(raw)) return raw
  const parts = raw.split("-")
  if (parts.length >= 2) return `${months[parseInt(parts[1], 10) - 1] ?? ""} ${parts[0]}`
  return raw
}

// ── Content sanitizer — strips internal debug text before it reaches the PDF ──

const DEBUG_PATTERNS = [
  /\s*\(AI rewrite unavailable[^)]*\)/gi,
  /\s*\(Add OPENAI_API_KEY[^)]*\)/gi,
  /\s*\[Add OPENAI_API_KEY[^\]]*\]/gi,
  /\s*\(add OPENAI_API_KEY[^)]*\)/gi,
]
function clean(text: string | undefined | null): string {
  if (!text) return ""
  let s = text
  for (const re of DEBUG_PATTERNS) s = s.replace(re, "")
  return s.trim()
}

// ── URL display helper — strips scheme + www for compactness ──────────────────
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
}

// ── Style factory ─────────────────────────────────────────────────────────────

function makeStyles(accent: string, serif: boolean) {
  const body = serif ? "Times-Roman" : "Helvetica"
  const bold = serif ? "Times-Bold"  : "Helvetica-Bold"

  return StyleSheet.create({
    // ── Page ──
    page: {
      fontFamily: body, fontSize: 9, color: "#1F2937",
      paddingTop: 40, paddingBottom: 52, paddingHorizontal: 44,
      lineHeight: 1.45,
    },

    // ── Header — stacked column, photo floated left ──────────────────────────
    // Strategy: headerWrap is a row. photoCol is fixed-width. textCol is flex:1.
    // Everything inside textCol is a pure column — no flex-wrap on the row itself.
    headerWrap:   { flexDirection: "row", marginBottom: 12 },
    photoCol:     { width: 60, marginRight: 14 },
    photoImg:     { width: 60, height: 60, borderRadius: 3 },
    textCol:      { flex: 1 },
    nameText:     { fontFamily: bold, fontSize: 21, color: "#111827", lineHeight: 1.1 },
    titleText:    { fontSize: 10.5, color: accent, marginTop: 2, lineHeight: 1.2 },
    contactText:  { fontSize: 8, color: "#4B5563", marginTop: 5, lineHeight: 1.6 },
    headerRule:   { borderBottomWidth: 2, borderBottomColor: accent, marginTop: 10, marginBottom: 0 },

    // ── Section ──────────────────────────────────────────────────────────────
    section:      { marginTop: 11 },
    secHeadRow:   { flexDirection: "row", alignItems: "center", marginBottom: 5 },
    secTitle:     { fontFamily: bold, fontSize: 8.5, textTransform: "uppercase", letterSpacing: 0.9, color: "#4B5563" },
    secLine:      { flex: 1, borderBottomWidth: 0.6, borderBottomColor: accent, marginLeft: 7, alignSelf: "center" },

    // ── Experience / Education items ──────────────────────────────────────────
    item:         { marginBottom: 8 },
    itemRow:      { flexDirection: "row", justifyContent: "space-between" },
    itemLeft:     { flex: 1, marginRight: 8 },
    itemRight:    { flexShrink: 0, maxWidth: 90 },
    itemTitle:    { fontFamily: bold, fontSize: 9.5, color: "#111827", lineHeight: 1.2 },
    itemSub:      { fontSize: 8.5, color: accent, marginTop: 1 },
    itemDate:     { fontSize: 8, color: "#6B7280", textAlign: "right", lineHeight: 1.3 },
    itemBody:     { fontSize: 8.5, color: "#374151", marginTop: 3, lineHeight: 1.55 },

    // ── Skills chips ──────────────────────────────────────────────────────────
    chipWrap:     { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
    chip:         { fontSize: 8, color: "#374151", borderWidth: 0.4, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 3 },

    // ── Certifications ────────────────────────────────────────────────────────
    certRow:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    certLeft:     { flex: 1, marginRight: 8 },
    certName:     { fontFamily: bold, fontSize: 9, color: "#111827" },
    certIssuer:   { fontSize: 8, color: accent, marginTop: 1 },
    certDate:     { fontSize: 8, color: "#6B7280", flexShrink: 0 },

    // ── Portfolio ────────────────────────────────────────────────────────────
    linkWrap:     { marginBottom: 5 },
    linkText:     { fontSize: 8, color: "#374151", lineHeight: 1.7 },
    linkAccent:   { color: accent },

    // ── Footer (watermark + page numbers) ────────────────────────────────────
    watermark:    { position: "absolute", bottom: 18, left: 44, right: 44, textAlign: "center", fontSize: 6.5, color: "#D1D5DB" },
    pageNum:      { position: "absolute", bottom: 18, right: 44, fontSize: 7, color: "#9CA3AF" },
  })
}

// ── Section heading ───────────────────────────────────────────────────────────

type Styles = ReturnType<typeof makeStyles>

function SHead({ title, s }: { title: string; s: Styles }) {
  return (
    <View style={s.secHeadRow}>
      <Text style={s.secTitle}>{title}</Text>
      <View style={s.secLine} />
    </View>
  )
}

// ── Platform label map ────────────────────────────────────────────────────────

const PLAT: Record<string, string> = {
  github: "GitHub", portfolio: "Portfolio", linkedin: "LinkedIn",
  behance: "Behance", dribbble: "Dribbble", medium: "Medium",
  stackoverflow: "Stack Overflow", kaggle: "Kaggle", leetcode: "LeetCode",
  hackerrank: "HackerRank", youtube: "YouTube", researchgate: "ResearchGate",
  twitter: "Twitter/X", website: "Website", custom: "Link",
}

// ── Main document ─────────────────────────────────────────────────────────────

export interface ResumePDFProps {
  data: ResumeData
  watermark?: boolean
  plan?: string
}

export function ResumePDF({ data, watermark = false }: ResumePDFProps) {
  const lang     = data.language ?? "en"
  const accent   = accentFor(data.template)
  const serif    = data.template === "academic"
  const s        = makeStyles(accent, serif)
  const present  = PRESENT[lang] ?? "Present"
  const contact  = data.contact
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ")

  const hasPhoto = !!(
    contact.photoDataUrl &&
    (contact.photoDataUrl.startsWith("data:image/") || contact.photoDataUrl.startsWith("http"))
  )

  // Job title from the most recent experience entry
  const jobTitle = data.experience[0]?.position ?? ""

  // Contact line — single text, wraps naturally, URLs stripped of scheme
  const contactParts: string[] = [
    contact.email,
    contact.phone,
    [contact.city, contact.country].filter(Boolean).join(", "),
    contact.linkedin ? displayUrl(contact.linkedin) : "",
    contact.website  ? displayUrl(contact.website)  : "",
    contact.address  ? contact.address               : "",
  ].filter(Boolean) as string[]
  const contactLine = contactParts.join("  ·  ")

  // Portfolio
  const portfolioLinks    = (data.portfolio?.links    ?? []).filter((l) => l.url?.trim())
  const featuredShowcases = (data.portfolio?.showcases ?? []).filter((s) => s.featured && (s.title || s.description))

  return (
    <Document
      title={data.title || "Resume"}
      author={fullName || undefined}
      subject="Resume"
      creator="GlobalResumeAI"
      producer="GlobalResumeAI"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.headerWrap} fixed={false}>
          {hasPhoto && (
            <View style={s.photoCol}>
              <Image src={contact.photoDataUrl!} style={s.photoImg} />
            </View>
          )}
          <View style={s.textCol}>
            <Text style={s.nameText}>{fullName || "Your Name"}</Text>
            {jobTitle ? <Text style={s.titleText}>{clean(jobTitle)}</Text> : null}
            {contactLine ? <Text style={s.contactText}>{contactLine}</Text> : null}
          </View>
        </View>
        <View style={s.headerRule} />

        {/* ── Professional Summary ────────────────────────────────────────── */}
        {data.summary && (
          <View style={s.section}>
            <SHead title={h(lang, "summary")} s={s} />
            <Text style={s.itemBody}>{clean(data.summary)}</Text>
          </View>
        )}

        {/* ── Work Experience ─────────────────────────────────────────────── */}
        {data.experience.length > 0 && (
          <View style={s.section}>
            <SHead title={h(lang, "experience")} s={s} />
            {data.experience.map((exp) => {
              const dateStr = [
                fmtDate(exp.startDate, lang),
                exp.current ? present : fmtDate(exp.endDate, lang),
              ].filter(Boolean).join(" – ")
              return (
                <View key={exp.id} style={s.item} wrap={false}>
                  <View style={s.itemRow}>
                    <View style={s.itemLeft}>
                      <Text style={s.itemTitle}>{clean(exp.position) || "Position"}</Text>
                      <Text style={s.itemSub}>{clean(exp.company) || "Company"}</Text>
                    </View>
                    {dateStr ? <Text style={s.itemDate}>{dateStr}</Text> : null}
                  </View>
                  {exp.description ? <Text style={s.itemBody}>{clean(exp.description)}</Text> : null}
                </View>
              )
            })}
          </View>
        )}

        {/* ── Education ──────────────────────────────────────────────────── */}
        {data.education.length > 0 && (
          <View style={s.section}>
            <SHead title={h(lang, "education")} s={s} />
            {data.education.map((edu) => {
              const degree = [edu.degree, edu.field].filter(Boolean).join(" in ") || "Degree"
              const dateStr = [fmtDate(edu.startDate, lang), fmtDate(edu.endDate, lang)].filter(Boolean).join(" – ")
              return (
                <View key={edu.id} style={s.item} wrap={false}>
                  <View style={s.itemRow}>
                    <View style={s.itemLeft}>
                      <Text style={s.itemTitle}>{degree}</Text>
                      <Text style={s.itemSub}>{edu.institution || "Institution"}</Text>
                    </View>
                    {dateStr ? <Text style={s.itemDate}>{dateStr}</Text> : null}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* ── Skills ─────────────────────────────────────────────────────── */}
        {data.skills.length > 0 && (
          <View style={s.section}>
            <SHead title={h(lang, "skills")} s={s} />
            <View style={s.chipWrap}>
              {data.skills.map((sk) => (
                <Text key={sk.id} style={s.chip}>
                  {sk.name}{sk.level && sk.level !== "Intermediate" ? ` · ${sk.level}` : ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* ── Projects ───────────────────────────────────────────────────── */}
        {data.projects && data.projects.length > 0 && (
          <View style={s.section}>
            <SHead title={h(lang, "projects")} s={s} />
            {data.projects.map((proj) => {
              const dateStr = [fmtDate(proj.startDate, lang), fmtDate(proj.endDate, lang)].filter(Boolean).join(" – ")
              return (
                <View key={proj.id} style={s.item} wrap={false}>
                  <View style={s.itemRow}>
                    <View style={s.itemLeft}>
                      <Text style={s.itemTitle}>{clean(proj.name) || "Project"}</Text>
                      {proj.url ? <Text style={s.itemSub}>{displayUrl(proj.url)}</Text> : null}
                    </View>
                    {dateStr ? <Text style={s.itemDate}>{dateStr}</Text> : null}
                  </View>
                  {proj.description ? <Text style={s.itemBody}>{clean(proj.description)}</Text> : null}
                </View>
              )
            })}
          </View>
        )}

        {/* ── Certifications ─────────────────────────────────────────────── */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={s.section}>
            <SHead title={h(lang, "certifications")} s={s} />
            {data.certifications.map((cert) => (
              <View key={cert.id} style={s.certRow} wrap={false}>
                <View style={s.certLeft}>
                  <Text style={s.certName}>{clean(cert.name) || "Certification"}</Text>
                  {cert.issuer ? <Text style={s.certIssuer}>{clean(cert.issuer)}</Text> : null}
                </View>
                {cert.date ? <Text style={s.certDate}>{fmtDate(cert.date, lang)}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* ── Languages ──────────────────────────────────────────────────── */}
        {data.languages && data.languages.length > 0 && (
          <View style={s.section}>
            <SHead title={h(lang, "languages")} s={s} />
            <View style={s.chipWrap}>
              {data.languages.map((l) => (
                <Text key={l.id} style={s.chip}>
                  {l.language}{l.proficiency ? ` · ${l.proficiency}` : ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* ── Portfolio ───────────────────────────────────────────────────── */}
        {(portfolioLinks.length > 0 || featuredShowcases.length > 0) && (
          <View style={s.section}>
            <SHead title={h(lang, "portfolio")} s={s} />

            {/* Links as a flowing text line */}
            {portfolioLinks.length > 0 && (
              <View style={s.linkWrap}>
                <Text style={s.linkText}>
                  {portfolioLinks.map((l, i) => (
                    `${i > 0 ? "  ·  " : ""}${PLAT[l.platform] ?? l.platform}: ${displayUrl(l.url)}`
                  )).join("")}
                </Text>
              </View>
            )}

            {/* Featured showcases */}
            {featuredShowcases.map((sc) => (
              <View key={sc.id} style={s.item} wrap={false}>
                <View style={s.itemRow}>
                  <View style={s.itemLeft}>
                    <Text style={s.itemTitle}>{clean(sc.title) || "Project"}</Text>
                    {sc.technologies ? <Text style={s.itemSub}>{clean(sc.technologies)}</Text> : null}
                  </View>
                  {sc.role ? <Text style={s.itemDate}>{clean(sc.role)}</Text> : null}
                </View>
                {sc.description ? <Text style={s.itemBody}>{clean(sc.description)}</Text> : null}
                {sc.achievements ? <Text style={s.itemBody}>{clean(sc.achievements)}</Text> : null}
                {(sc.githubUrl || sc.demoUrl) && (
                  <Text style={[s.linkText, s.linkAccent]}>
                    {[sc.githubUrl, sc.demoUrl].filter(Boolean).map(displayUrl).join("  ·  ")}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Watermark ──────────────────────────────────────────────────── */}
        {watermark && (
          <Text style={s.watermark} fixed>
            Generated with GlobalResumeAI · Free Plan · Upgrade to remove this watermark
          </Text>
        )}

        {/* ── Page number ────────────────────────────────────────────────── */}
        <Text
          style={s.pageNum}
          render={({ pageNumber, totalPages }) => totalPages > 1 ? `${pageNumber} / ${totalPages}` : ""}
          fixed
        />
      </Page>
    </Document>
  )
}

// ── Public export helper — API route only ─────────────────────────────────────

export async function buildResumePDF(
  data: ResumeData,
  watermark = false,
  plan = "FREE"
): Promise<Buffer> {
  const lang = data.language ?? "en"
  if (lang === "ja" || lang === "zh") ensureCJKFont()

  const { renderToBuffer } = await import("@react-pdf/renderer")
  const buffer = await renderToBuffer(<ResumePDF data={data} watermark={watermark} plan={plan} />)
  return buffer
}
