/**
 * Zod schemas for structured AI outputs.
 * Guards against malformed responses before they reach the client.
 */
import { z } from "zod"

// ── ATS optimization response ─────────────────────────────────────────────────

export const atsOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  suggestions: z.array(z.string().max(500)).min(1).max(10),
})

export type ATSOutput = z.infer<typeof atsOutputSchema>

export function parseATSOutput(raw: string): ATSOutput {
  // Strip markdown code fences GPT sometimes wraps around JSON
  const json = raw
    .replace(/^```(?:json)?[\r\n]*/i, "")
    .replace(/[\r\n]*```$/, "")
    .trim()

  const parsed = JSON.parse(json)
  return atsOutputSchema.parse(parsed)
}

// ── Plain text guard ──────────────────────────────────────────────────────────

export function validateTextOutput(content: string, minLength = 1, maxLength = 10_000): string {
  const cleaned = content.trim()
  if (cleaned.length < minLength) throw new Error("AI returned empty content")
  return cleaned.slice(0, maxLength)
}

// ── Bullet point guard ────────────────────────────────────────────────────────

export function validateBulletOutput(raw: string): string {
  return raw
    .replace(/^[-•*]\s*/, "")
    .replace(/\n[\s\S]*/, "") // keep only first line
    .trim()
    .slice(0, 400)
}
