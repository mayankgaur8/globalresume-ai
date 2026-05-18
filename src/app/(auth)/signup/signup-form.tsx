"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, Loader2, Eye, EyeOff, Shield, Zap, Globe2 } from "lucide-react"
import { useToast } from "@/components/ui/toaster"

const HIGHLIGHTS = [
  { icon: <Zap className="h-5 w-5 text-blue-400" />, title: "AI-powered writing", desc: "Generate bullet points and summaries in seconds" },
  { icon: <Globe2 className="h-5 w-5 text-blue-400" />, title: "25+ languages", desc: "Localized resumes for Germany, France, Japan & more" },
  { icon: <Shield className="h-5 w-5 text-blue-400" />, title: "ATS-optimized", desc: "Pass Applicant Tracking Systems at top companies" },
]

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)]
  const score = checks.filter(Boolean).length
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"]
  const labels = ["Weak", "Fair", "Good", "Strong"]
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < score ? colors[score - 1] : "bg-slate-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score < 2 ? "text-red-500" : score < 3 ? "text-yellow-600" : "text-green-600"}`}>
        {labels[score - 1] ?? "Too short"}
      </p>
    </div>
  )
}

interface Props {
  googleEnabled: boolean
}

async function readSignupResponse(res: Response) {
  const contentType = res.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const data = (await res.json().catch(() => null)) as {
      message?: unknown
      code?: unknown
    } | null

    return {
      message: typeof data?.message === "string" ? data.message : "",
      code: typeof data?.code === "string" ? data.code : "",
    }
  }

  return { message: await res.text().catch(() => ""), code: "" }
}

export function SignupForm({ googleEnabled }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")

  const onSubmit = async (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const pwd = formData.get("password") as string
    const name = formData.get("name") as string

    if (pwd.length < 8) {
      setError("Password must be at least 8 characters.")
      setIsLoading(false)
      return
    }

    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: pwd, name: name.trim() }),
      })

      if (!registerRes.ok) {
        const { message, code } = await readSignupResponse(registerRes)
        console.error("[SIGNUP_FRONTEND]", {
          status: registerRes.status,
          code,
          message,
          email: email.trim().toLowerCase(),
        })

        if (registerRes.status === 409 || code === "EMAIL_EXISTS") {
          setError("An account with this email already exists. Try signing in.")
        } else if (registerRes.status === 503 || code === "DATABASE_UNAVAILABLE") {
          setError("Database unavailable. Please try again in a moment.")
        } else {
          setError(message || "Registration failed. Please try again.")
        }
        setIsLoading(false)
        return
      }

      const res = await signIn("credentials", { email: email.trim().toLowerCase(), password: pwd, redirect: false })
      if (res?.error) {
        console.error("[SIGNUP_FRONTEND]", {
          status: "signin_failed",
          error: res.error,
          email: email.trim().toLowerCase(),
        })
        setError("Account created! Please sign in.")
        router.push("/login")
      } else {
        toast("Account created! Welcome to GlobalResumeAI.", "success")
        router.push("/onboarding")
        router.refresh()
      }
    } catch (error) {
      console.error("[SIGNUP_FRONTEND]", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true)
    signIn("google", { callbackUrl: "/onboarding" })
  }

  const busy = isLoading || isGoogleLoading

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-indigo-400 blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 group">
            <Globe className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="text-2xl font-bold tracking-tight text-white">GlobalResume<span className="text-blue-400">AI</span></span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />Free to get started
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight">Join 50,000+<br />career builders</h2>
            <p className="mt-4 text-slate-300 text-lg leading-relaxed">Create your first professional resume in under 10 minutes — no credit card required.</p>
          </div>
          <div className="space-y-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="shrink-0 h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">{h.icon}</div>
                <div>
                  <p className="text-white font-semibold text-sm">{h.title}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-500 text-xs">&copy; {new Date().getFullYear()} GlobalResumeAI. All rights reserved.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-white">
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">GlobalResume<span className="text-blue-600">AI</span></span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create your account</h1>
            <p className="mt-2 text-slate-500">Free forever. Upgrade when you&apos;re ready.</p>
          </div>

          {googleEnabled && (
            <>
              <Button
                variant="outline"
                type="button"
                className="w-full h-11 border-slate-200 hover:bg-slate-50 font-medium text-slate-700"
                onClick={handleGoogleSignIn}
                disabled={busy}
              >
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                <span className="ml-2">Sign up with Google</span>
              </Button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium uppercase tracking-wider">or sign up with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-slate-700 font-medium text-sm">Full name</Label>
              <Input id="name" name="name" autoComplete="name" placeholder="Jane Smith" required disabled={busy} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium text-sm">Email address</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required disabled={busy} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={busy}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-slate-200 pr-10"
                  placeholder="Minimum 8 characters"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">
                <span className="shrink-0">⚠</span>{error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={busy}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account&hellip;</> : "Create free account"}
            </Button>

            <p className="text-center text-xs text-slate-400">
              By signing up, you agree to our{" "}
              <Link href="#" className="underline underline-offset-2 hover:text-slate-600">Terms</Link>{" "}and{" "}
              <Link href="#" className="underline underline-offset-2 hover:text-slate-600">Privacy Policy</Link>.
            </p>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
