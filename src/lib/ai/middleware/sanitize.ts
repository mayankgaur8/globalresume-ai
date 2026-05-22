/**
 * Input sanitization middleware — strips prompt injection attempts and enforces
 * per-field length limits before user data reaches the AI provider.
 */

const INJECTION_PATTERNS = [
  /\bignore\s+(previous|above|all|prior)\s+(instructions?|prompts?|context)\b/gi,
  /\bsystem\s*prompt\b/gi,
  /\bact\s+as\s+(?:a\s+)?(?:different|new|another)\b/gi,
  /\bdisregard\s+(?:all\s+)?(?:previous|above)\b/gi,
  /\byou\s+are\s+now\b/gi,
  /\bpretend\s+(?:you\s+are|to\s+be)\b/gi,
  /\bdo\s+not\s+follow\s+(?:your|the)\s+instructions?\b/gi,
]

export const INPUT_LIMITS = {
  jobTitle: 200,
  bullet: 500,
  summary: 3000,
  experienceText: 2500,
  resumeText: 8000,
  jobDescription: 5000,
  text: 8000,
  name: 100,
  company: 200,
  technologies: 300,
  skills: 1000,
} as const

export type InputField = keyof typeof INPUT_LIMITS

export function sanitize(input: string, field: InputField): string {
  if (!input) return ""

  let cleaned = input.slice(0, INPUT_LIMITS[field])

  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[removed]")
  }

  return cleaned.trim()
}

export function sanitizeMany<T extends Record<string, string>>(
  inputs: T,
  fieldMap: Partial<Record<keyof T, InputField>>
): T {
  const result = { ...inputs }
  for (const [key, field] of Object.entries(fieldMap) as [keyof T, InputField][]) {
    if (typeof result[key] === "string") {
      result[key] = sanitize(result[key] as string, field) as T[keyof T]
    }
  }
  return result
}
