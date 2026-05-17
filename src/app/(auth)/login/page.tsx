import { LoginForm } from "./login-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Sign In — GlobalResumeAI" }

export default function LoginPage() {
  const googleEnabled =
    !!process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_ID !== "dummy-google-client-id" &&
    !!process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_SECRET !== "dummy-google-client-secret"

  return <LoginForm googleEnabled={googleEnabled} />
}
