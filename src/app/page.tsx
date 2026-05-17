import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, FileText, CheckCircle2, Zap, ArrowRight, Languages } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              GlobalResume<span className="text-blue-600">AI</span>
            </span>
          </div>
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</Link>
            <Link href="#templates" className="text-sm font-medium text-slate-600 hover:text-slate-900">Templates</Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Log in</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-24 md:py-32 lg:py-40 overflow-hidden">
        <div className="container mx-auto max-w-5xl text-center z-10 relative">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
            AI-Powered Multilingual Resume Builder
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8">
            Your Dream Job, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              In Any Language.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-slate-600 mb-10 leading-relaxed">
            Create professional, ATS-friendly resumes in English, German, French, Japanese, and more. 
            Tailor your application to local markets with our AI assistant.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                Create Your Resume <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#templates">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-white">
                View Templates
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100 rounded-full blur-3xl opacity-50 -z-10"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to land the interview
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Powerful tools designed to help you stand out in the global job market.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
              <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">ATS-Friendly Templates</h3>
              <p className="text-slate-600">
                Professionally designed templates optimized for Applicant Tracking Systems globally.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
              <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                <Languages className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">7+ Languages</h3>
              <p className="text-slate-600">
                Build your resume in English, German, French, Spanish, Japanese, Chinese, and Portuguese.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
              <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mb-6">
                <Zap className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Resume Assistant</h3>
              <p className="text-slate-600">
                Generate professional summaries, improve bullet points, and translate content instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Teaser) */}
      <section id="pricing" className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl mb-6">Simple, transparent pricing</h2>
          <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">
            Choose the perfect plan for your career goals, whether you&apos;re applying locally or going global.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {/* Free */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-slate-400 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> 1 Basic Template</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> English Only</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> PDF with Watermark</li>
              </ul>
              <Button variant="outline" className="w-full text-slate-900 bg-white hover:bg-slate-100">Get Started</Button>
            </div>
            
            {/* Pro */}
            <div className="bg-blue-600 rounded-3xl p-8 border border-blue-500 relative transform md:-translate-y-4 shadow-xl shadow-blue-900/50">
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">$15<span className="text-lg text-blue-200 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-200" /> 8 Premium Templates</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-200" /> 3 Languages</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-200" /> AI Resume Assistant</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-200" /> Unlimited PDF Exports</li>
              </ul>
              <Button className="w-full bg-white text-blue-600 hover:bg-slate-100">Upgrade to Pro</Button>
            </div>
            
            {/* Global */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
              <h3 className="text-xl font-semibold mb-2">Global</h3>
              <div className="text-4xl font-bold mb-6">$29<span className="text-lg text-slate-400 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> All Templates</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> All Languages Unlocked</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> Advanced AI Translation</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> ATS Score Checker</li>
              </ul>
              <Button variant="outline" className="w-full text-slate-900 bg-white hover:bg-slate-100">Go Global</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200 mt-auto">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="h-5 w-5" />
            <span className="text-lg font-bold text-slate-900">GlobalResumeAI</span>
          </div>
          <p>© {new Date().getFullYear()} GlobalResumeAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
