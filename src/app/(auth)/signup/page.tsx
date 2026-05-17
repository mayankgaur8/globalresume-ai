import { SignupForm } from "./signup-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Create Account — GlobalResumeAI" }

export default function SignupPage() {
  const googleEnabled =
    !!process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_ID !== "dummy-google-client-id" &&
    !!process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_SECRET !== "dummy-google-client-secret"

  return <SignupForm googleEnabled={googleEnabled} />
}
