import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Globe, FileText, CheckCircle2, ArrowRight,
  Star, Shield, BarChart3, Sparkles, Users, TrendingUp,
  ChevronDown, Check, BrainCircuit, Globe2, PenTool,
} from "lucide-react"

// ─── Data ──────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "en", flag: "🇺🇸", name: "English", subtitle: "USA, UK, Canada, Australia", locked: false },
  { code: "de", flag: "🇩🇪", name: "Deutsch", subtitle: "Germany, Austria, Switzerland", locked: true },
  { code: "fr", flag: "🇫🇷", name: "Français", subtitle: "France, Belgium, Canada", locked: true },
  { code: "es", flag: "🇪🇸", name: "Español", subtitle: "Spain, Latin America", locked: true },
  { code: "pt", flag: "🇧🇷", name: "Português", subtitle: "Brazil, Portugal", locked: true },
  { code: "ja", flag: "🇯🇵", name: "日本語", subtitle: "Japan", locked: true },
  { code: "zh", flag: "🇨🇳", name: "中文", subtitle: "China, Taiwan, Singapore", locked: true },
]

const FEATURES = [
  {
    icon: <BrainCircuit className="h-6 w-6 text-blue-600" />,
    title: "AI-Powered Writing",
    description: "Generate professional summaries, rewrite bullet points, and craft compelling achievements with GPT-4.",
    color: "bg-blue-50",
  },
  {
    icon: <Globe2 className="h-6 w-6 text-indigo-600" />,
    title: "Multilingual & Local Formats",
    description: "Auto-adapt your resume to German Lebenslauf, French CV, Japanese Rirekisho, and more.",
    color: "bg-indigo-50",
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-green-600" />,
    title: "ATS Score Optimizer",
    description: "Scan your resume against job descriptions and get a real-time ATS compatibility score.",
    color: "bg-green-50",
  },
  {
    icon: <PenTool className="h-6 w-6 text-purple-600" />,
    title: "Designer Templates",
    description: "12 professionally designed, recruiter-approved templates for every industry and market.",
    color: "bg-purple-50",
  },
  {
    icon: <FileText className="h-6 w-6 text-amber-600" />,
    title: "Clean PDF Export",
    description: "Download a pixel-perfect, print-ready PDF with one click. No watermarks on paid plans.",
    color: "bg-amber-50",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-pink-600" />,
    title: "Cover Letter Generator",
    description: "Generate personalized cover letters that match your resume in tone, language, and style.",
    color: "bg-pink-50",
  },
]

const TESTIMONIALS = [
  {
    name: "Maria Schmidt",
    role: "Software Engineer → Berlin",
    avatar: "MS",
    rating: 5,
    text: "I got my German work visa and landed a job at a Berlin startup in 3 weeks. The Lebenslauf template was exactly what German recruiters expected.",
    flag: "🇩🇪",
  },
  {
    name: "Kenji Tanaka",
    role: "Product Manager → Tokyo",
    avatar: "KT",
    rating: 5,
    text: "The Japanese Rirekisho template saved me countless hours. The AI translated my entire resume accurately and formatted it perfectly.",
    flag: "🇯🇵",
  },
  {
    name: "Sophie Laurent",
    role: "Marketing Director → Paris",
    avatar: "SL",
    rating: 5,
    text: "Moving from the US to France, I had no idea how different French CVs were. GlobalResumeAI guided me through every step — I got 3 interviews in a week.",
    flag: "🇫🇷",
  },
]

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Start building your first resume",
    features: ["1 Basic Template (Modern)", "English Only", "PDF with Watermark", "Resume Builder"],
    cta: "Get Started Free",
    href: "/signup",
    highlight: false,
    badge: null,
  },
  {
    name: "Basic",
    price: "₹799",
    period: "/month",
    description: "For focused job seekers",
    features: ["3 Templates", "1 Language of Your Choice", "Clean PDF Export (No Watermark)", "AI Summary Generator"],
    cta: "Start Basic",
    href: "/signup",
    highlight: false,
    badge: null,
  },
  {
    name: "Pro",
    price: "₹1,299",
    period: "/month",
    description: "For international applicants",
    features: ["8 Premium Templates", "3 Languages", "AI Resume Rewriter", "ATS Score Checker", "Cover Letter Generator"],
    cta: "Start Pro — Most Popular",
    href: "/signup",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Global",
    price: "₹2,499",
    period: "/month",
    description: "Unlimited global applications",
    features: ["All 17 Templates", "All 7 Languages", "AI Translation Engine", "Cover Letter AI", "Priority Support"],
    cta: "Go Global",
    href: "/signup",
    highlight: false,
    badge: null,
  },
]

const FAQS = [
  {
    q: "What makes GlobalResumeAI different from other resume builders?",
    a: "We're the only resume builder specifically designed for international job seekers. We support 7 languages, 12 country-specific formats (like German Lebenslauf and Japanese Rirekisho), and use AI to translate and adapt your resume to local hiring expectations — not just copy-paste translate.",
  },
  {
    q: "Can I create resumes in multiple languages?",
    a: "Yes. Depending on your plan, you can create resumes in 1 to 7 languages. Our AI translates your content while preserving professional tone, and automatically applies the correct local resume format for each country.",
  },
  {
    q: "How does the ATS optimization work?",
    a: "You paste a job description and our AI analyzes your resume for keyword matches, formatting compatibility, and scoring. It highlights missing keywords and suggests improvements to increase your match score.",
  },
  {
    q: "Do I need to know the local resume format for each country?",
    a: "No. When you choose a target country, GlobalResumeAI automatically applies the correct format — including required sections like photo (Germany), date of birth (Japan), or personal summary (UK).",
  },
  {
    q: "Is my resume data secure?",
    a: "Yes. Your data is encrypted in transit and at rest. We never sell or share your personal information. You can delete your account and all data at any time.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Absolutely. There are no long-term commitments. Cancel anytime and you keep access until the end of your billing period.",
  },
]

// ─── Resume Preview Mockup Component ───────────────────────────────────────────

function ResumeMockup() {
  return (
    <div className="relative">
      {/* Shadow cards behind */}
      <div className="absolute inset-0 translate-x-4 translate-y-4 bg-blue-100 rounded-2xl" />
      <div className="absolute inset-0 translate-x-2 translate-y-2 bg-indigo-100 rounded-2xl" />
      {/* Main card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-72">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            AK
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Alex Kim</p>
            <p className="text-xs text-blue-600">Senior Product Manager</p>
            <p className="text-xs text-slate-400 mt-0.5">Berlin, Germany</p>
          </div>
        </div>
        {/* Summary */}
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Summary</p>
          <div className="space-y-1">
            <div className="h-2 bg-slate-100 rounded w-full" />
            <div className="h-2 bg-slate-100 rounded w-5/6" />
            <div className="h-2 bg-slate-100 rounded w-4/6" />
          </div>
        </div>
        {/* Experience */}
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Experience</p>
          <div className="space-y-2">
            {["Product Manager · Google · 2021–Now", "PM Intern · Shopify · 2019–2021"].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                <p className="text-[9px] text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Skills */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Skills</p>
          <div className="flex flex-wrap gap-1">
            {["Product Strategy", "Agile", "SQL", "Figma", "German"].map((s) => (
              <span key={s} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        </div>
        {/* ATS Badge */}
        <div className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
          ATS ✓ 98%
        </div>
      </div>
    </div>
  )
}

// ─── FAQ Accordion (Client-free, pure CSS) ──────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-slate-200 rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
        <span className="font-medium text-slate-900 pr-4">{q}</span>
        <ChevronDown className="h-5 w-5 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
        {a}
      </div>
    </details>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Globe className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              GlobalResume<span className="text-blue-600">AI</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-7">
            {["Features", "Languages", "Templates", "Pricing"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex text-slate-700">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.1),transparent_70%)]" />

        <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 relative z-10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-blue-200 mb-8">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered · 7 Languages · 12 Templates
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
                Build a Job-Winning Resume{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  in Any Language
                </span>
              </h1>
              <p className="text-xl text-blue-100/80 mb-8 leading-relaxed max-w-xl">
                Create ATS-friendly resumes for global job markets using AI-powered writing, translation,
                professional templates, and country-specific localization.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base bg-blue-500 hover:bg-blue-400 shadow-lg shadow-blue-900/50 w-full sm:w-auto"
                  >
                    Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#templates">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 text-base border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur w-full sm:w-auto"
                  >
                    View Templates
                  </Button>
                </Link>
              </div>
              {/* Trust stats */}
              <div className="flex flex-wrap gap-6 text-sm text-blue-200/70">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>50,000+ users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span>4.9/5 rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>100% secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>3× more interviews</span>
                </div>
              </div>
            </div>
            {/* Right mockup */}
            <div className="flex justify-center lg:justify-end">
              <ResumeMockup />
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              From blank page to dream job in minutes
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <FileText className="h-6 w-6 text-blue-600" />,
                title: "Choose Your Template",
                description: "Pick from 12 professionally designed templates optimized for the country you're targeting.",
              },
              {
                step: "02",
                icon: <Sparkles className="h-6 w-6 text-indigo-600" />,
                title: "AI Writes & Translates",
                description: "Enter your experience and let AI generate professional summaries and translate to any language.",
              },
              {
                step: "03",
                icon: <FileText className="h-6 w-6 text-green-600" />,
                title: "Download & Apply",
                description: "Export a pixel-perfect PDF and start applying to jobs globally with confidence.",
              },
            ].map((step) => (
              <div key={step.step} className="relative flex flex-col items-center text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-6xl font-black text-slate-100 select-none">
                  {step.step}
                </div>
                <div className="relative z-10 h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
                  {step.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Languages ── */}
      <section id="languages" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">Multilingual</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Apply anywhere in the world
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Each language comes with the correct local resume format, not just a translation.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {LANGUAGES.map((lang) => (
              <div
                key={lang.code}
                className="relative bg-white rounded-2xl border border-slate-200 p-4 text-center hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="text-4xl mb-2">{lang.flag}</div>
                <p className="font-semibold text-slate-900 text-sm">{lang.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{lang.subtitle}</p>
                {lang.locked && (
                  <span className="absolute top-2 right-2 text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                    Pro
                  </span>
                )}
                {!lang.locked && (
                  <span className="absolute top-2 right-2 text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">
                    Free
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Templates ── */}
      <section id="templates" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">Templates</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Designed to impress. Built to get hired.
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              12 templates crafted by professional designers and optimized for global ATS systems.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[
              { name: "Modern", color: "from-blue-500 to-indigo-600", free: true },
              { name: "Classic", color: "from-slate-600 to-slate-800", free: false },
              { name: "Executive", color: "from-indigo-600 to-purple-700", free: false },
              { name: "Minimal", color: "from-slate-400 to-slate-500", free: false },
              { name: "Creative", color: "from-pink-500 to-rose-600", free: false },
              { name: "ATS Friendly", color: "from-green-500 to-emerald-600", free: false },
              { name: "German Lebenslauf", color: "from-amber-500 to-orange-600", free: false },
              { name: "French CV", color: "from-red-500 to-rose-600", free: false },
            ].map((t) => (
              <div
                key={t.name}
                className="group cursor-pointer"
              >
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all">
                  {/* Template visual */}
                  <div className={`h-48 bg-gradient-to-br ${t.color} p-4 flex flex-col gap-2`}>
                    <div className="h-3 w-3/4 bg-white/40 rounded" />
                    <div className="h-2 w-1/2 bg-white/30 rounded" />
                    <div className="h-px w-full bg-white/20 my-1" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-2 bg-white/25 rounded w-full" />
                      <div className="h-2 bg-white/25 rounded w-5/6" />
                      <div className="h-2 bg-white/25 rounded w-4/6" />
                    </div>
                  </div>
                  {!t.free && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Pro
                    </div>
                  )}
                  {t.free && (
                    <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Free
                    </div>
                  )}
                </div>
                <p className="mt-2 font-medium text-slate-800 text-sm text-center">{t.name}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Browse All Templates <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to land the interview
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Powerful tools designed to help you stand out in any job market, in any language.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md hover:border-slate-200 transition-all"
              >
                <div className={`h-12 w-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Country-specific resume optimization strip ── */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="bg-white/20 text-white border-white/30 mb-4">Country Optimization</Badge>
              <h2 className="text-3xl font-bold mb-4">
                Your resume, adapted for every market
              </h2>
              <p className="text-blue-100 leading-relaxed mb-6">
                A resume that works in the US won&apos;t land you a job in Germany. Different markets have
                different expectations — from required photos and date of birth in Germany to Rirekisho
                form structure in Japan. GlobalResumeAI auto-adapts to every format.
              </p>
              <ul className="space-y-2.5">
                {[
                  "🇩🇪 German Lebenslauf with photo & birthdate",
                  "🇯🇵 Japanese Rirekisho formal structure",
                  "🇫🇷 French CV with personal info block",
                  "🇬🇧 UK CV with no personal info (GDPR)",
                  "🇺🇸 US Resume, 1-page ATS format",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-blue-100 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-300 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="grid grid-cols-3 gap-3">
                {["🇺🇸", "🇩🇪", "🇫🇷", "🇯🇵", "🇪🇸", "🇧🇷"].map((flag) => (
                  <div
                    key={flag}
                    className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-3xl hover:bg-white/20 transition-colors"
                  >
                    {flag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Choose the perfect plan. Start free, upgrade when you need more.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.highlight
                    ? "bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-200 scale-105"
                    : "bg-white border-slate-200"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-5">
                  <p className={`font-bold text-lg ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.name}
                  </p>
                  <p className={`text-sm mt-0.5 ${plan.highlight ? "text-blue-200" : "text-slate-500"}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className={`text-4xl font-black ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlight ? "text-blue-200" : "text-slate-400"}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-sm ${plan.highlight ? "text-blue-100" : "text-slate-600"}`}
                    >
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlight ? "text-blue-300" : "text-blue-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className="w-full">
                  <Button
                    className={`w-full font-semibold ${
                      plan.highlight
                        ? "bg-white text-blue-600 hover:bg-blue-50"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-8">
            Prices in INR · Payments via Razorpay · No credit card required to start · Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Loved by job seekers worldwide
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role} {t.flag}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Questions? We have answers.
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
          <div className="text-5xl mb-6">🌍</div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5">
            Your dream job is waiting.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              In any language.
            </span>
          </h2>
          <p className="text-blue-200 text-xl mb-10 leading-relaxed">
            Join 50,000+ professionals who use GlobalResumeAI to land jobs across borders. Start free — no
            credit card required.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="h-14 px-10 text-lg bg-blue-500 hover:bg-blue-400 shadow-xl shadow-blue-900/50"
            >
              Create Your Free Resume <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-blue-300/60 text-sm">Free forever · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-white text-sm">GlobalResumeAI</span>
              </Link>
              <p className="text-sm leading-relaxed">
                The world&apos;s most complete multilingual resume builder for global professionals.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Product</p>
              <ul className="space-y-2 text-sm">
                {["Features", "Templates", "Languages", "Pricing"].map((item) => (
                  <li key={item}>
                    <Link href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Account</p>
              <ul className="space-y-2 text-sm">
                {[
                  { label: "Log In", href: "/login" },
                  { label: "Sign Up Free", href: "/signup" },
                  { label: "Dashboard", href: "/dashboard" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Legal</p>
              <ul className="space-y-2 text-sm">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            © {new Date().getFullYear()} GlobalResumeAI. All rights reserved. Made with ❤️ for global job seekers.
          </div>
        </div>
      </footer>
    </div>
  )
}
