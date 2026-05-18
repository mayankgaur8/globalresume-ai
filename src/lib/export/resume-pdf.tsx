/**
 * resume-pdf.tsx
 *
 * Server-side PDF renderer using @react-pdf/renderer.
 * Called exclusively from /api/resumes/pdf/route.ts via renderToBuffer().
 * Must NOT be imported in any client component or layout.
 *
 * Font strategy:
 *  - Helvetica (standard PDF font) for all Latin scripts — zero overhead, always available
 *  - Times-Roman for Academic template variant
 *  - External NotoSans registered once per process for CJK/Arabic (graceful fallback on failure)
 */

import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
  Link,
} from "@react-pdf/renderer"
import type { ResumeData } from "@/store/useResumeStore"

// ── Font registration ─────────────────────────────────────────────────────────

// Disable hyphenation — keeps ATS parsers happy
Font.registerHyphenationCallback((word) => [word])

// Noto Sans for full Unicode/CJK — registered once per process lifecycle.
// Failure is silently caught; Latin content degrades to Helvetica.
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
  } catch {
    // Font CDN unreachable — Helvetica fallback is still valid for Latin
  }
}

// ── Accent colours per template ───────────────────────────────────────────────

const ACCENT: Record<string, string> = {
  modern: "#3B82F6",
  classic: "#1E3A5F",
  minimal: "#374151",
  "ats-friendly": "#1E40AF",
  executive: "#1E293B",
  creative: "#7C3AED",
  global: "#0F766E",
  "global-tech": "#0D9488",
  "consultant-pro": "#D97706",
  academic: "#374151",
  german: "#DC2626",
  french: "#1D4ED8",
  japanese: "#9F1239",
  spanish: "#B45309",
  portuguese: "#15803D",
  "uae-pro": "#1E3A5F",
  "euro-card": "#1E3A5F",
}

function accentFor(template: string): string {
  return ACCENT[template] ?? "#3B82F6"
}

// ── Date helpers ──────────────────────────────────────────────────────────────

const MONTH_NAMES: Record<string, string[]> = {
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

function fmtDate(raw: string, lang: string): string {
  if (!raw) return ""
  const months = MONTH_NAMES[lang] ?? MONTH_NAMES.en
  // "YYYY" → year only
  if (/^\d{4}$/.test(raw)) return raw
  // "YYYY-MM" or "YYYY-MM-DD"
  const parts = raw.split("-")
  if (parts.length >= 2) {
    const m = parseInt(parts[1], 10) - 1
    return `${months[m] ?? ""} ${parts[0]}`
  }
  return raw
}

// ── Section heading styles ─────────────────────────────────────────────────────

const HEADINGS: Record<string, Record<string, string>> = {
  en: { summary:"Professional Summary", experience:"Work Experience", education:"Education", skills:"Skills", projects:"Projects", certifications:"Certifications", languages:"Languages", portfolio:"Portfolio" },
  de: { summary:"Profil", experience:"Berufserfahrung", education:"Ausbildung", skills:"Fähigkeiten", projects:"Projekte", certifications:"Zertifizierungen", languages:"Sprachen", portfolio:"Portfolio" },
  fr: { summary:"Profil", experience:"Expérience professionnelle", education:"Formation", skills:"Compétences", projects:"Projets", certifications:"Certifications", languages:"Langues", portfolio:"Portfolio" },
  es: { summary:"Perfil profesional", experience:"Experiencia laboral", education:"Educación", skills:"Habilidades", projects:"Proyectos", certifications:"Certificaciones", languages:"Idiomas", portfolio:"Portfolio" },
  pt: { summary:"Perfil profissional", experience:"Experiência profissional", education:"Formação", skills:"Competências", projects:"Projetos", certifications:"Certificações", languages:"Idiomas", portfolio:"Portfolio" },
  ja: { summary:"プロフィール", experience:"職務経歴", education:"学歴", skills:"スキル", projects:"プロジェクト", certifications:"資格・認定", languages:"語学", portfolio:"ポートフォリオ" },
  zh: { summary:"个人简介", experience:"工作经历", education:"教育背景", skills:"专业技能", projects:"项目经验", certifications:"证书", languages:"语言能力", portfolio:"作品集" },
}

function h(lang: string, key: string): string {
  return (HEADINGS[lang] ?? HEADINGS.en)[key] ?? key
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(accent: string, useSerif: boolean) {
  const bodyFont = useSerif ? "Times-Roman" : "Helvetica"
  const boldFont = useSerif ? "Times-Bold" : "Helvetica-Bold"

  return StyleSheet.create({
    page: {
      fontFamily: bodyFont,
      fontSize: 9,
      color: "#1F2937",
      paddingTop: 36,
      paddingBottom: 48,
      paddingHorizontal: 40,
      lineHeight: 1.4,
    },
    // Header
    header: { marginBottom: 14 },
    headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    photo: { width: 56, height: 56, borderRadius: 4, objectFit: "cover" },
    headerText: { flex: 1 },
    name: { fontFamily: boldFont, fontSize: 20, color: "#111827", letterSpacing: 0.3 },
    tagline: { fontSize: 10, color: accent, marginTop: 2, marginBottom: 4 },
    contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
    contactItem: { fontSize: 8, color: "#4B5563" },
    contactDot: { fontSize: 8, color: "#9CA3AF" },
    headerDivider: { borderBottomWidth: 2, borderBottomColor: accent, marginTop: 10 },
    // Section
    section: { marginTop: 10 },
    sectionHead: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
    sectionTitle: { fontFamily: boldFont, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, color: "#374151" },
    sectionLine: { flex: 1, borderBottomWidth: 0.75, borderBottomColor: accent, marginLeft: 6, alignSelf: "center" },
    // Experience / education items
    item: { marginBottom: 7 },
    itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    itemTitle: { fontFamily: boldFont, fontSize: 9.5, color: "#111827" },
    itemSub: { fontSize: 9, color: accent },
    itemDate: { fontSize: 8, color: "#6B7280", textAlign: "right" },
    itemBody: { fontSize: 8.5, color: "#374151", marginTop: 3, lineHeight: 1.5 },
    // Skills / chips
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
    chip: { fontSize: 8, color: "#374151", borderWidth: 0.5, borderColor: "#D1D5DB", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
    // Certification
    certRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    certName: { fontFamily: boldFont, fontSize: 9, color: "#111827" },
    certIssuer: { fontSize: 8, color: accent },
    certDate: { fontSize: 8, color: "#6B7280" },
    // Portfolio links
    linkRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
    linkLabel: { fontFamily: boldFont, fontSize: 8, color: "#374151" },
    linkUrl: { fontSize: 8, color: accent },
    // Watermark
    watermark: { position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#D1D5DB" },
    // Page number
    pageNum: { position: "absolute", bottom: 16, right: 40, fontSize: 7, color: "#9CA3AF" },
  })
}

// ── Section heading component ─────────────────────────────────────────────────

function SHead({ title, styles }: { title: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  )
}

// ── Platform labels for portfolio links ───────────────────────────────────────

const PLATFORM_LABEL: Record<string, string> = {
  github: "GitHub", portfolio: "Portfolio", linkedin: "LinkedIn",
  behance: "Behance", dribbble: "Dribbble", medium: "Medium",
  stackoverflow: "Stack Overflow", kaggle: "Kaggle", leetcode: "LeetCode",
  hackerrank: "HackerRank", youtube: "YouTube", researchgate: "ResearchGate",
  twitter: "Twitter/X", website: "Website", custom: "Link",
}

// ── Main PDF Document ─────────────────────────────────────────────────────────

export interface ResumePDFProps {
  data: ResumeData
  watermark?: boolean
  plan?: string
}

export function ResumePDF({ data, watermark = false, plan = "FREE" }: ResumePDFProps) {
  const lang = data.language ?? "en"
  const accent = accentFor(data.template)
  const useSerif = data.template === "academic"
  const styles = makeStyles(accent, useSerif)
  const presentLabel = PRESENT[lang] ?? "Present"

  const contact = data.contact
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ")
  const hasPhoto = !!contact.photoDataUrl && (
    contact.photoDataUrl.startsWith("data:image/") ||
    contact.photoDataUrl.startsWith("http")
  )

  // Contact items — only non-empty values
  const contactItems: string[] = [
    contact.email, contact.phone,
    [contact.city, contact.country].filter(Boolean).join(", "),
    contact.linkedin, contact.website,
  ].filter(Boolean) as string[]

  // Portfolio links
  const portfolioLinks = (data.portfolio?.links ?? []).filter((l) => l.url?.trim())
  const featuredShowcases = (data.portfolio?.showcases ?? []).filter((s) => s.featured && (s.title || s.description))

  return (
    <Document
      title={data.title || "Resume"}
      author={fullName}
      subject="Resume"
      creator="GlobalResumeAI"
      producer="GlobalResumeAI"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {hasPhoto && (
              <Image
                src={contact.photoDataUrl!}
                style={styles.photo}
              />
            )}
            <View style={styles.headerText}>
              <Text style={styles.name}>{fullName || "Your Name"}</Text>
              {data.experience.length > 0 && data.experience[0].position && (
                <Text style={styles.tagline}>{data.experience[0].position}</Text>
              )}
              <View style={styles.contactRow}>
                {contactItems.map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <Text style={styles.contactDot}>·</Text>}
                    <Text style={styles.contactItem}>{item}</Text>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.headerDivider} />
        </View>

        {/* ── Summary ── */}
        {data.summary && (
          <View style={styles.section}>
            <SHead title={h(lang, "summary")} styles={styles} />
            <Text style={styles.itemBody}>{data.summary}</Text>
          </View>
        )}

        {/* ── Experience ── */}
        {data.experience.length > 0 && (
          <View style={styles.section}>
            <SHead title={h(lang, "experience")} styles={styles} />
            {data.experience.map((exp) => (
              <View key={exp.id} style={styles.item} wrap={false}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{exp.position || "Position"}</Text>
                    <Text style={styles.itemSub}>{exp.company || "Company"}</Text>
                  </View>
                  <Text style={styles.itemDate}>
                    {fmtDate(exp.startDate, lang)}
                    {(exp.startDate || exp.current || exp.endDate) ? " – " : ""}
                    {exp.current ? presentLabel : fmtDate(exp.endDate, lang)}
                  </Text>
                </View>
                {exp.description && (
                  <Text style={styles.itemBody}>{exp.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Education ── */}
        {data.education.length > 0 && (
          <View style={styles.section}>
            <SHead title={h(lang, "education")} styles={styles} />
            {data.education.map((edu) => (
              <View key={edu.id} style={styles.item} wrap={false}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>
                      {[edu.degree, edu.field].filter(Boolean).join(" in ") || "Degree"}
                    </Text>
                    <Text style={styles.itemSub}>{edu.institution || "Institution"}</Text>
                  </View>
                  {(edu.startDate || edu.endDate) && (
                    <Text style={styles.itemDate}>
                      {fmtDate(edu.startDate, lang)}
                      {edu.endDate ? ` – ${fmtDate(edu.endDate, lang)}` : ""}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Skills ── */}
        {data.skills.length > 0 && (
          <View style={styles.section}>
            <SHead title={h(lang, "skills")} styles={styles} />
            <View style={styles.chipRow}>
              {data.skills.map((skill) => (
                <Text key={skill.id} style={styles.chip}>
                  {skill.name}{skill.level && skill.level !== "Intermediate" ? ` · ${skill.level}` : ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* ── Projects ── */}
        {data.projects && data.projects.length > 0 && (
          <View style={styles.section}>
            <SHead title={h(lang, "projects")} styles={styles} />
            {data.projects.map((proj) => (
              <View key={proj.id} style={styles.item} wrap={false}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{proj.name || "Project"}</Text>
                  {(proj.startDate || proj.endDate) && (
                    <Text style={styles.itemDate}>
                      {fmtDate(proj.startDate, lang)}
                      {proj.endDate ? ` – ${fmtDate(proj.endDate, lang)}` : ""}
                    </Text>
                  )}
                </View>
                {proj.url && <Text style={styles.itemSub}>{proj.url}</Text>}
                {proj.description && <Text style={styles.itemBody}>{proj.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* ── Certifications ── */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={styles.section}>
            <SHead title={h(lang, "certifications")} styles={styles} />
            {data.certifications.map((cert) => (
              <View key={cert.id} style={styles.certRow} wrap={false}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certName}>{cert.name || "Certification"}</Text>
                  {cert.issuer && <Text style={styles.certIssuer}>{cert.issuer}</Text>}
                </View>
                {cert.date && <Text style={styles.certDate}>{fmtDate(cert.date, lang)}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* ── Languages ── */}
        {data.languages && data.languages.length > 0 && (
          <View style={styles.section}>
            <SHead title={h(lang, "languages")} styles={styles} />
            <View style={styles.chipRow}>
              {data.languages.map((l) => (
                <Text key={l.id} style={styles.chip}>
                  {l.language}{l.proficiency ? ` · ${l.proficiency}` : ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* ── Portfolio ── */}
        {(portfolioLinks.length > 0 || featuredShowcases.length > 0) && (
          <View style={styles.section}>
            <SHead title={h(lang, "portfolio")} styles={styles} />

            {portfolioLinks.length > 0 && (
              <View style={styles.linkRow}>
                {portfolioLinks.map((l) => (
                  <View key={l.id} style={{ flexDirection: "row", gap: 3 }}>
                    <Text style={styles.linkLabel}>{PLATFORM_LABEL[l.platform] ?? l.platform}:</Text>
                    <Text style={styles.linkUrl}>{l.url.replace(/^https?:\/\//, "")}</Text>
                  </View>
                ))}
              </View>
            )}

            {featuredShowcases.map((sc) => (
              <View key={sc.id} style={styles.item} wrap={false}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{sc.title || "Project"}</Text>
                  {sc.role && <Text style={styles.itemDate}>{sc.role}</Text>}
                </View>
                {sc.technologies && <Text style={styles.itemSub}>{sc.technologies}</Text>}
                {sc.description && <Text style={styles.itemBody}>{sc.description}</Text>}
                {sc.achievements && <Text style={styles.itemBody}>{sc.achievements}</Text>}
                {(sc.githubUrl || sc.demoUrl) && (
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
                    {sc.githubUrl && <Text style={styles.linkUrl}>{sc.githubUrl.replace(/^https?:\/\//, "")}</Text>}
                    {sc.demoUrl && <Text style={styles.linkUrl}>{sc.demoUrl.replace(/^https?:\/\//, "")}</Text>}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Watermark (free plan) ── */}
        {watermark && (
          <Text style={styles.watermark}>
            Generated with GlobalResumeAI · Free Plan · Upgrade to remove watermark
          </Text>
        )}

        {/* ── Page number ── */}
        <Text
          style={styles.pageNum}
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `${pageNumber} / ${totalPages}` : ""
          }
          fixed
        />
      </Page>
    </Document>
  )
}

// ── Export helper — call from API route only ──────────────────────────────────

export async function buildResumePDF(data: ResumeData, watermark = false, plan = "FREE"): Promise<Buffer> {
  // Ensure CJK font is registered for Japanese/Chinese resumes
  const lang = data.language ?? "en"
  if (lang === "ja" || lang === "zh") ensureCJKFont()

  const { renderToBuffer } = await import("@react-pdf/renderer")
  const element = <ResumePDF data={data} watermark={watermark} plan={plan} />
  const buffer = await renderToBuffer(element)
  return buffer
}
