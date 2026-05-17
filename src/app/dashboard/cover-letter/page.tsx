import type { Metadata } from "next"
import { CoverLetterClient } from "./cover-letter-client"

export const metadata: Metadata = { title: "Cover Letter — GlobalResumeAI" }

export default function CoverLetterPage() {
  return <CoverLetterClient />
}
