"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, Loader2, Eye, EyeOff, CheckCircle2, Star } from "lucide-react"
import { useToast } from "@/components/ui/toaster"

const FEATURES = [
  "ATS-optimized resumes for every country",
  "AI-powered content in 25+ languages",
  "One-click PDF export with professional templates",
  "Real-time feedback and scoring",
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

interface Props {
  googleEnabled: boolean
}

export function LoginForm({ googleEnabled }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const res = await signIn("credentials", { email, password, redirect: false })
      if (res?.error) {
        setError("Invalid email or password. Please try again.")
      } else {
        toast("Welcome back!", "success")
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true)
    signIn("google", { callbackUrl: "/dashboard" })
  }

  const busy = isLoading || isGoogleLoading

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-indigo-400 blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 group">
            <Globe className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="text-2xl font-bold tracking-tight text-white">
              GlobalResume<span className="text-blue-400">AI</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-3">Trusted by 50,000+ job seekers</p>
            <h2 className="text-4xl font-bold text-white leading-tight">Your global career<br />starts here</h2>
            <p className="mt-4 text-slate-300 text-lg leading-relaxed">Build ATS-optimized resumes for any country, in any language, powered by AI.</p>
          </div>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 text-sm">{f}</span>
              </li>
            ))}
          </ul>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-white text-sm leading-relaxed italic">
              &ldquo;I landed my dream job in Germany within 3 weeks of using GlobalResumeAI. The localized template made all the difference.&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">S</div>
              <div>
                <p className="text-white text-sm font-semibold">Sofia M.</p>
                <p className="text-slate-400 text-xs">Software Engineer, Berlin</p>
              </div>
            </div>
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
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="mt-2 text-slate-500">Sign in to continue building your career</p>
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
                <span className="ml-2">Continue with Google</span>
              </Button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium uppercase tracking-wider">or sign in with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium text-sm">Email address</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required disabled={busy} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Password</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required disabled={busy} className="h-11 border-slate-200 pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">
                <span className="shrink-0">⚠</span>{error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={busy}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in&hellip;</> : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-500">Create one free</Link>
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 mb-2">Demo credentials</p>
            <p><span className="font-medium">User:</span> demo@globalresumeai.com / Demo@12345</p>
            <p><span className="font-medium">Admin:</span> admin@globalresumeai.com / Admin@12345</p>
          </div>
        </div>
      </div>
    </div>
  )
}
