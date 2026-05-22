import type { Metadata } from "next"
import "./globals.css"
import { ToastProvider } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: {
    default: "GlobalResumeAI — Build a Job-Winning Resume in Any Language",
    template: "%s | GlobalResumeAI",
  },
  description:
    "Create ATS-friendly resumes for global job markets using AI-powered writing, translation, professional templates, and country-specific localization.",
  keywords: [
    "resume builder",
    "CV builder",
    "multilingual resume",
    "ATS resume",
    "AI resume",
    "German CV",
    "French CV",
    "international resume",
    "job application",
  ],
  openGraph: {
    type: "website",
    siteName: "GlobalResumeAI",
    title: "GlobalResumeAI — Build a Job-Winning Resume in Any Language",
    description:
      "Create ATS-friendly resumes for global job markets using AI-powered writing, translation, and professional templates.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GlobalResumeAI",
    description: "Build a Job-Winning Resume in Any Language",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
