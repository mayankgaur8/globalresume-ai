"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Lock, CheckCircle2, Sparkles, Search, X, ArrowRight, Star, Users, Globe2, Zap, Award } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ── Template metadata ─────────────────────────────────────────────────────────

interface TemplateMeta {
  category: string
  langs: string[]
  desc: string
  badge?: string
  badgeColor?: string
  targetCountry?: string
  usedBy?: string
  bestFor?: string[]
}

const TEMPLATE_META: Record<string, TemplateMeta> = {
  Modern: {
    category: "Universal",
    langs: ["EN", "DE", "FR", "ES", "PT"],
    desc: "Clean, minimal — great for tech & startups. ATS-optimized single-column with blue accent.",
    badge: "Most Popular",
    badgeColor: "bg-blue-500",
    usedBy: "12,400+",
    bestFor: ["Tech", "Startups", "Remote Jobs"],
  },
  Classic: {
    category: "Universal",
    langs: ["EN", "DE", "FR"],
    desc: "Traditional serif layout trusted by finance, law, and corporate hiring managers.",
    badge: "Recruiter Preferred",
    badgeColor: "bg-slate-700",
    usedBy: "8,200+",
    bestFor: ["Finance", "Law", "Corporate"],
  },
  Executive: {
    category: "Universal",
    langs: ["EN"],
    desc: "Bold dark header for senior roles. Commands attention and projects leadership.",
    badge: "For Senior Roles",
    badgeColor: "bg-amber-600",
    usedBy: "3,100+",
    bestFor: ["C-Suite", "Directors", "VP+"],
  },
  Minimal: {
    category: "Universal",
    langs: ["EN", "ES"],
    desc: "Ultra-clean whitespace-first design. Let your content shine without distractions.",
    bestFor: ["Design", "Writing", "Consulting"],
    usedBy: "5,600+",
  },
  Creative: {
    category: "Creative",
    langs: ["EN", "FR"],
    desc: "Vibrant color blocks for designers, marketers, and creatives who want to stand out.",
    badge: "For Creatives",
    badgeColor: "bg-pink-500",
    usedBy: "2,900+",
    bestFor: ["Design", "Marketing", "Media"],
  },
  "ATS Friendly": {
    category: "ATS",
    langs: ["EN"],
    desc: "Plain structure engineered to score 95%+ on any ATS parser. Zero formatting risks.",
    badge: "ATS Optimized",
    badgeColor: "bg-emerald-600",
    usedBy: "9,800+",
    bestFor: ["Any Industry", "Large Companies", "FAANG"],
  },
  "European CV": {
    category: "Europe",
    langs: ["EN", "DE", "FR", "ES"],
    desc: "Europass-inspired layout accepted across all EU countries. Includes skills matrix.",
    badge: "Best for Europe",
    badgeColor: "bg-violet-600",
    targetCountry: "🇪🇺",
    usedBy: "6,400+",
    bestFor: ["EU Jobs", "Erasmus", "Relocation"],
  },
  "German Lebenslauf": {
    category: "Germany",
    langs: ["DE"],
    desc: "Meets German employer expectations — professional photo, DOB, and German section labels.",
    badge: "Best for Germany",
    badgeColor: "bg-gray-800",
    targetCountry: "🇩🇪",
    usedBy: "4,200+",
    bestFor: ["Germany", "Austria", "Switzerland"],
  },
  "French CV": {
    category: "France",
    langs: ["FR"],
    desc: "Photo-first layout with French-style section ordering expected by Paris recruiters.",
    badge: "Best for France",
    badgeColor: "bg-blue-800",
    targetCountry: "🇫🇷",
    usedBy: "2,800+",
    bestFor: ["France", "Belgium", "Quebec"],
  },
  "Japanese Rirekisho": {
    category: "Japan",
    langs: ["JA"],
    desc: "Structured grid format matching traditional Japanese expectations. Dates in Japanese era.",
    badge: "Best for Japan",
    badgeColor: "bg-red-700",
    targetCountry: "🇯🇵",
    usedBy: "1,900+",
    bestFor: ["Japan", "Japanese Companies"],
  },
  "Spanish CV": {
    category: "Spain",
    langs: ["ES"],
    desc: "Warm professional layout tailored for Spanish and Latin American hiring markets.",
    badge: "Best for Spain & LATAM",
    badgeColor: "bg-red-600",
    targetCountry: "🇪🇸",
    usedBy: "3,300+",
    bestFor: ["Spain", "Mexico", "Argentina"],
  },
  "Portuguese CV": {
    category: "Brazil",
    langs: ["PT"],
    desc: "Clean international style optimized for Brazilian and Portuguese job applications.",
    badge: "Best for Brazil",
    badgeColor: "bg-green-700",
    targetCountry: "🇧🇷",
    usedBy: "2,100+",
    bestFor: ["Brazil", "Portugal"],
  },
}

const CATEGORIES = ["All", "Universal", "ATS", "Europe", "Germany", "France", "Japan", "Spain", "Brazil", "Creative"]

// ── Realistic mini resume previews per template ───────────────────────────────

function ResumePreviewModern() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* Blue accent bar */}
      <rect x="0" y="0" width="160" height="52" fill="#2563EB" />
      {/* Name */}
      <rect x="12" y="12" width="80" height="8" rx="2" fill="rgba(255,255,255,0.9)" />
      <rect x="12" y="24" width="55" height="5" rx="1.5" fill="rgba(255,255,255,0.6)" />
      {/* Contact row */}
      <rect x="12" y="34" width="30" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="48" y="34" width="30" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="84" y="34" width="30" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
      {/* Blue divider */}
      <rect x="12" y="44" width="136" height="1" fill="rgba(255,255,255,0.3)" />
      {/* Summary section */}
      <rect x="12" y="60" width="40" height="4" rx="1" fill="#2563EB" />
      <rect x="12" y="70" width="136" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="75" width="120" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="80" width="100" height="2.5" rx="1" fill="#E2E8F0" />
      {/* Experience section */}
      <rect x="12" y="92" width="56" height="4" rx="1" fill="#2563EB" />
      <rect x="12" y="102" width="80" height="3" rx="1" fill="#1E293B" />
      <rect x="12" y="108" width="55" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="110" y="102" width="38" height="2.5" rx="1" fill="#CBD5E1" />
      <rect x="12" y="114" width="136" height="2" rx="1" fill="#E2E8F0" />
      <rect x="12" y="119" width="110" height="2" rx="1" fill="#E2E8F0" />
      <rect x="12" y="124" width="90" height="2" rx="1" fill="#E2E8F0" />
      {/* Second job */}
      <rect x="12" y="132" width="75" height="3" rx="1" fill="#1E293B" />
      <rect x="12" y="138" width="50" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="110" y="132" width="38" height="2.5" rx="1" fill="#CBD5E1" />
      <rect x="12" y="144" width="136" height="2" rx="1" fill="#E2E8F0" />
      <rect x="12" y="149" width="100" height="2" rx="1" fill="#E2E8F0" />
      {/* Skills section */}
      <rect x="12" y="161" width="30" height="4" rx="1" fill="#2563EB" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={12 + i * 28} y="170" width="22" height="8" rx="4" fill={i < 3 ? "#DBEAFE" : "#F1F5F9"} />
      ))}
      {/* Education */}
      <rect x="12" y="186" width="44" height="4" rx="1" fill="#2563EB" />
      <rect x="12" y="196" width="90" height="3" rx="1" fill="#1E293B" />
      <rect x="12" y="202" width="60" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="110" y="196" width="38" height="2.5" rx="1" fill="#CBD5E1" />
    </svg>
  )
}

function ResumePreviewClassic() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* Centered header */}
      <rect x="30" y="10" width="100" height="9" rx="2" fill="#1E293B" />
      <rect x="40" y="23" width="80" height="5" rx="1.5" fill="#475569" />
      <rect x="20" y="31" width="120" height="2.5" rx="1" fill="#CBD5E1" />
      {/* Horizontal rule */}
      <rect x="12" y="38" width="136" height="1.5" fill="#1E293B" />
      <rect x="12" y="42" width="136" height="0.5" fill="#475569" />
      {/* Two columns */}
      {/* Left col */}
      <rect x="12" y="50" width="45" height="4" rx="1" fill="#1E293B" />
      <rect x="12" y="58" width="60" height="2.5" rx="1" fill="#475569" />
      <rect x="12" y="63" width="45" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="12" y="70" width="60" height="2" rx="1" fill="#E2E8F0" />
      <rect x="12" y="75" width="55" height="2" rx="1" fill="#E2E8F0" />
      <rect x="12" y="80" width="50" height="2" rx="1" fill="#E2E8F0" />
      <rect x="12" y="90" width="45" height="4" rx="1" fill="#1E293B" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="12" y={98 + i * 7} width={55 - i * 5} height="2.5" rx="1" fill="#94A3B8" />
      ))}
      {/* Vertical divider */}
      <rect x="80" y="48" width="1" height="160" fill="#E2E8F0" />
      {/* Right col */}
      <rect x="88" y="50" width="45" height="4" rx="1" fill="#1E293B" />
      <rect x="88" y="58" width="60" height="3" rx="1" fill="#475569" />
      <rect x="88" y="64" width="40" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="88" y="70" width="60" height="2" rx="1" fill="#E2E8F0" />
      <rect x="88" y="75" width="55" height="2" rx="1" fill="#E2E8F0" />
      <rect x="88" y="80" width="45" height="2" rx="1" fill="#E2E8F0" />
      <rect x="88" y="88" width="60" height="3" rx="1" fill="#475569" />
      <rect x="88" y="94" width="40" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="88" y="100" width="60" height="2" rx="1" fill="#E2E8F0" />
      <rect x="88" y="105" width="50" height="2" rx="1" fill="#E2E8F0" />
      <rect x="88" y="110" width="45" height="2" rx="1" fill="#E2E8F0" />
      {/* Skills right */}
      <rect x="88" y="120" width="45" height="4" rx="1" fill="#1E293B" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="88" y={128 + i * 10} width={50 - i * 3} height="3.5" rx="1" fill="#F1F5F9" />
          <rect x="88" y={128 + i * 10} width={(50 - i * 3) * (0.9 - i * 0.1)} height="3.5" rx="1" fill="#1E293B" opacity="0.15" />
        </g>
      ))}
    </svg>
  )
}

function ResumePreviewExecutive() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* Dark premium header */}
      <rect x="0" y="0" width="160" height="60" fill="#0F172A" />
      <rect x="0" y="57" width="160" height="4" fill="#D97706" />
      <rect x="12" y="10" width="90" height="10" rx="2" fill="rgba(255,255,255,0.95)" />
      <rect x="12" y="24" width="65" height="6" rx="1.5" fill="#D97706" />
      <rect x="12" y="34" width="40" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="58" y="34" width="40" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="104" y="34" width="44" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="12" y="42" width="120" height="3" rx="1" fill="rgba(255,255,255,0.35)" />
      <rect x="12" y="48" width="100" height="3" rx="1" fill="rgba(255,255,255,0.35)" />
      {/* Section */}
      <rect x="12" y="72" width="56" height="5" rx="1" fill="#0F172A" />
      <rect x="12" y="80" width="136" height="1" fill="#E2E8F0" />
      <rect x="12" y="86" width="80" height="3.5" rx="1" fill="#1E293B" />
      <rect x="12" y="92" width="50" height="2.5" rx="1" fill="#D97706" />
      <rect x="110" y="86" width="38" height="2.5" rx="1" fill="#CBD5E1" />
      <rect x="12" y="98" width="136" height="2" rx="1" fill="#E2E8F0" />
      <rect x="12" y="103" width="120" height="2" rx="1" fill="#E2E8F0" />
      <rect x="12" y="108" width="90" height="2" rx="1" fill="#E2E8F0" />
      {/* Second role */}
      <rect x="12" y="118" width="75" height="3.5" rx="1" fill="#1E293B" />
      <rect x="12" y="124" width="50" height="2.5" rx="1" fill="#D97706" />
      <rect x="110" y="118" width="38" height="2.5" rx="1" fill="#CBD5E1" />
      <rect x="12" y="130" width="136" height="2" rx="1" fill="#E2E8F0" />
      <rect x="12" y="135" width="110" height="2" rx="1" fill="#E2E8F0" />
      {/* Board/Skills section */}
      <rect x="12" y="148" width="40" height="5" rx="1" fill="#0F172A" />
      <rect x="12" y="156" width="136" height="1" fill="#E2E8F0" />
      <rect x="12" y="162" width="136" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="168" width="100" height="2.5" rx="1" fill="#E2E8F0" />
      {/* Education */}
      <rect x="12" y="180" width="44" height="5" rx="1" fill="#0F172A" />
      <rect x="12" y="188" width="136" height="1" fill="#E2E8F0" />
      <rect x="12" y="194" width="90" height="3" rx="1" fill="#1E293B" />
      <rect x="12" y="200" width="60" height="2.5" rx="1" fill="#94A3B8" />
    </svg>
  )
}

function ResumePreviewMinimal() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* Very sparse layout */}
      <rect x="12" y="18" width="96" height="9" rx="2" fill="#0F172A" />
      <rect x="12" y="31" width="60" height="4" rx="1" fill="#64748B" />
      <rect x="12" y="40" width="136" height="0.5" fill="#CBD5E1" />
      <rect x="12" y="48" width="50" height="2.5" rx="1" fill="#CBD5E1" />
      <rect x="70" y="48" width="50" height="2.5" rx="1" fill="#CBD5E1" />
      {/* Summary — light */}
      <rect x="12" y="60" width="136" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="66" width="110" height="2.5" rx="1" fill="#E2E8F0" />
      {/* Experience */}
      <rect x="12" y="80" width="30" height="3" rx="1" fill="#64748B" />
      <rect x="12" y="90" width="136" height="0.5" fill="#F1F5F9" />
      <rect x="12" y="96" width="75" height="3" rx="1" fill="#0F172A" />
      <rect x="12" y="103" width="50" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="110" y="96" width="38" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="110" width="136" height="2" rx="1" fill="#F1F5F9" />
      <rect x="12" y="115" width="110" height="2" rx="1" fill="#F1F5F9" />
      <rect x="12" y="125" width="75" height="3" rx="1" fill="#0F172A" />
      <rect x="12" y="132" width="50" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="110" y="125" width="38" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="139" width="136" height="2" rx="1" fill="#F1F5F9" />
      <rect x="12" y="144" width="90" height="2" rx="1" fill="#F1F5F9" />
      {/* Skills */}
      <rect x="12" y="158" width="30" height="3" rx="1" fill="#64748B" />
      <rect x="12" y="168" width="136" height="0.5" fill="#F1F5F9" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={12 + i * 46} y="174" width="40" height="6" rx="3" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.5" />
      ))}
      {/* Education */}
      <rect x="12" y="190" width="44" height="3" rx="1" fill="#64748B" />
      <rect x="12" y="200" width="136" height="0.5" fill="#F1F5F9" />
      <rect x="12" y="207" width="90" height="2.5" rx="1" fill="#0F172A" />
    </svg>
  )
}

function ResumePreviewCreative() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* Left color sidebar */}
      <rect x="0" y="0" width="44" height="220" fill="#EC4899" />
      {/* Accent shapes */}
      <circle cx="22" cy="32" r="14" fill="rgba(255,255,255,0.15)" />
      <circle cx="22" cy="32" r="10" fill="rgba(255,255,255,0.2)" />
      {/* Photo circle on sidebar */}
      <circle cx="22" cy="32" r="8" fill="rgba(255,255,255,0.9)" />
      {/* Sidebar labels */}
      <rect x="6" y="52" width="32" height="2.5" rx="1" fill="rgba(255,255,255,0.7)" />
      <rect x="6" y="58" width="26" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="6" y="64" width="30" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="6" y="70" width="22" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
      {/* Skills on sidebar */}
      <rect x="4" y="86" width="36" height="3" rx="1" fill="rgba(255,255,255,0.8)" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="6" y={94 + i * 12} width="32" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
          <rect x="6" y={94 + i * 12} width={32 * [0.9, 0.7, 0.85, 0.6][i]} height="4" rx="2" fill="rgba(255,255,255,0.4)" />
        </g>
      ))}
      {/* Right main content */}
      <rect x="56" y="14" width="90" height="9" rx="2" fill="#1E293B" />
      <rect x="56" y="27" width="65" height="5" rx="1.5" fill="#EC4899" />
      <rect x="56" y="38" width="90" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="56" y="44" width="75" height="2.5" rx="1" fill="#E2E8F0" />
      {/* Section */}
      <rect x="56" y="58" width="45" height="4" rx="1" fill="#EC4899" />
      <rect x="56" y="66" width="80" height="3" rx="1" fill="#1E293B" />
      <rect x="56" y="73" width="55" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="56" y="79" width="90" height="2" rx="1" fill="#F1F5F9" />
      <rect x="56" y="84" width="80" height="2" rx="1" fill="#F1F5F9" />
      <rect x="56" y="95" width="80" height="3" rx="1" fill="#1E293B" />
      <rect x="56" y="102" width="55" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="56" y="108" width="90" height="2" rx="1" fill="#F1F5F9" />
      <rect x="56" y="113" width="70" height="2" rx="1" fill="#F1F5F9" />
      {/* Portfolio section */}
      <rect x="56" y="124" width="45" height="4" rx="1" fill="#EC4899" />
      {[0, 1].map((i) => (
        <rect key={i} x={56 + i * 48} y="132" width="42" height="28" rx="3" fill={i === 0 ? "#FCE7F3" : "#FDF2F8"} />
      ))}
    </svg>
  )
}

function ResumePreviewATS() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* Pure text layout, no colors */}
      <rect x="12" y="12" width="85" height="8" rx="1.5" fill="#111827" />
      <rect x="12" y="24" width="60" height="4" rx="1" fill="#374151" />
      <rect x="12" y="32" width="136" height="2.5" rx="1" fill="#D1D5DB" />
      <rect x="12" y="38" width="90" height="2.5" rx="1" fill="#D1D5DB" />
      {/* Divider */}
      <rect x="12" y="46" width="136" height="1" fill="#111827" />
      {/* Work Experience */}
      <rect x="12" y="52" width="70" height="4" rx="1" fill="#111827" />
      <rect x="12" y="60" width="80" height="3" rx="1" fill="#374151" />
      <rect x="12" y="66" width="55" height="2.5" rx="1" fill="#6B7280" />
      <rect x="100" y="60" width="48" height="2.5" rx="1" fill="#D1D5DB" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="12" y={74 + i * 6} width={136 - i * 20} height="2" rx="1" fill="#E5E7EB" />
      ))}
      <rect x="12" y="96" width="75" height="3" rx="1" fill="#374151" />
      <rect x="12" y="102" width="50" height="2.5" rx="1" fill="#6B7280" />
      <rect x="100" y="96" width="48" height="2.5" rx="1" fill="#D1D5DB" />
      {[0, 1].map((i) => (
        <rect key={i} x="12" y={110 + i * 6} width={136 - i * 30} height="2" rx="1" fill="#E5E7EB" />
      ))}
      {/* Divider */}
      <rect x="12" y="122" width="136" height="1" fill="#111827" />
      {/* Skills */}
      <rect x="12" y="128" width="30" height="4" rx="1" fill="#111827" />
      <rect x="12" y="136" width="136" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="142" width="110" height="2.5" rx="1" fill="#E5E7EB" />
      {/* Divider */}
      <rect x="12" y="150" width="136" height="1" fill="#111827" />
      {/* Education */}
      <rect x="12" y="156" width="44" height="4" rx="1" fill="#111827" />
      <rect x="12" y="164" width="90" height="3" rx="1" fill="#374151" />
      <rect x="12" y="170" width="65" height="2.5" rx="1" fill="#6B7280" />
      <rect x="100" y="164" width="48" height="2.5" rx="1" fill="#D1D5DB" />
      {/* Divider */}
      <rect x="12" y="180" width="136" height="1" fill="#111827" />
      <rect x="12" y="186" width="50" height="4" rx="1" fill="#111827" />
      <rect x="12" y="194" width="136" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="200" width="100" height="2.5" rx="1" fill="#E5E7EB" />
    </svg>
  )
}

function ResumePreviewEuropean() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* EU Blue header */}
      <rect x="0" y="0" width="160" height="48" fill="#1D4ED8" />
      <rect x="0" y="45" width="160" height="4" fill="#FBBF24" />
      {/* Star row (EU flag reference) */}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={68 + i * 6} cy={8} r={1.5} fill="#FBBF24" />
      ))}
      <rect x="12" y="14" width="75" height="8" rx="2" fill="rgba(255,255,255,0.9)" />
      <rect x="12" y="25" width="55" height="5" rx="1.5" fill="rgba(255,255,255,0.65)" />
      <rect x="12" y="34" width="40" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="58" y="34" width="40" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
      {/* Two-column body */}
      {/* Left col */}
      <rect x="12" y="58" width="50" height="4" rx="1" fill="#1D4ED8" />
      <rect x="12" y="66" width="60" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="72" width="55" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="78" width="45" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="88" width="40" height="4" rx="1" fill="#1D4ED8" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="12" y={96 + i * 10} width="60" height="3" rx="1" fill="#F1F5F9" />
          <rect x="12" y={96 + i * 10} width={60 * [0.9, 0.75, 0.85, 0.7][i]} height="3" rx="1" fill="#DBEAFE" />
        </g>
      ))}
      {/* Right col */}
      <rect x="80" y="58" width="65" height="0.5" fill="#E2E8F0" />
      <rect x="80" y="62" width="55" height="4" rx="1" fill="#1D4ED8" />
      <rect x="80" y="70" width="70" height="3" rx="1" fill="#1E293B" />
      <rect x="80" y="76" width="50" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="80" y="82" width="68" height="2" rx="1" fill="#E2E8F0" />
      <rect x="80" y="87" width="60" height="2" rx="1" fill="#E2E8F0" />
      <rect x="80" y="97" width="70" height="3" rx="1" fill="#1E293B" />
      <rect x="80" y="103" width="50" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="80" y="109" width="68" height="2" rx="1" fill="#E2E8F0" />
      <rect x="80" y="114" width="55" height="2" rx="1" fill="#E2E8F0" />
      {/* Languages */}
      <rect x="12" y="150" width="45" height="4" rx="1" fill="#1D4ED8" />
      {["EN", "DE", "FR"].map((l, i) => (
        <g key={l}>
          <rect x={12 + i * 24} y="158" width="20" height="6" rx="3" fill="#DBEAFE" />
        </g>
      ))}
    </svg>
  )
}

function ResumePreviewGerman() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* German flag stripe */}
      <rect x="0" y="0" width="160" height="5" fill="#1E293B" />
      <rect x="0" y="5" width="160" height="5" fill="#DC2626" />
      <rect x="0" y="10" width="160" height="5" fill="#D97706" />
      {/* Photo box (German CVs have photos) */}
      <rect x="110" y="20" width="38" height="48" rx="3" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.5" />
      <circle cx="129" cy="38" r="12" fill="#CBD5E1" />
      <rect x="117" y="53" width="24" height="10" rx="1" fill="#CBD5E1" />
      {/* Name block */}
      <rect x="12" y="20" width="85" height="9" rx="2" fill="#1E293B" />
      <rect x="12" y="33" width="65" height="5" rx="1.5" fill="#64748B" />
      {/* Personal details */}
      <rect x="12" y="44" width="28" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="44" y="44" width="50" height="2.5" rx="1" fill="#475569" />
      <rect x="12" y="50" width="28" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="44" y="50" width="55" height="2.5" rx="1" fill="#475569" />
      <rect x="12" y="56" width="28" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="44" y="56" width="45" height="2.5" rx="1" fill="#475569" />
      {/* Divider */}
      <rect x="12" y="76" width="136" height="1.5" fill="#1E293B" />
      {/* Berufserfahrung */}
      <rect x="12" y="82" width="68" height="4" rx="1" fill="#1E293B" />
      <rect x="12" y="92" width="80" height="3" rx="1" fill="#374151" />
      <rect x="12" y="98" width="55" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="100" y="92" width="48" height="2.5" rx="1" fill="#CBD5E1" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="12" y={106 + i * 6} width={136 - i * 15} height="2" rx="1" fill="#E5E7EB" />
      ))}
      {/* Ausbildung */}
      <rect x="12" y="128" width="136" height="1.5" fill="#1E293B" />
      <rect x="12" y="134" width="44" height="4" rx="1" fill="#1E293B" />
      <rect x="12" y="142" width="90" height="3" rx="1" fill="#374151" />
      <rect x="12" y="148" width="60" height="2.5" rx="1" fill="#94A3B8" />
      {/* Kenntnisse */}
      <rect x="12" y="160" width="136" height="1.5" fill="#1E293B" />
      <rect x="12" y="166" width="40" height="4" rx="1" fill="#1E293B" />
      <rect x="12" y="174" width="136" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="180" width="110" height="2.5" rx="1" fill="#E5E7EB" />
    </svg>
  )
}

function ResumePreviewFrench() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* French flag sidebar */}
      <rect x="0" y="0" width="8" height="220" fill="#1D4ED8" />
      <rect x="8" y="0" width="8" height="220" fill="#fff" />
      <rect x="16" y="0" width="8" height="220" fill="#DC2626" />
      {/* Photo prominent */}
      <rect x="28" y="12" width="36" height="44" rx="4" fill="#E2E8F0" />
      <circle cx="46" cy="28" r="12" fill="#CBD5E1" />
      <rect x="31" y="43" width="30" height="10" rx="2" fill="#CBD5E1" />
      {/* Name + info */}
      <rect x="72" y="14" width="76" height="8" rx="2" fill="#1E293B" />
      <rect x="72" y="26" width="55" height="5" rx="1.5" fill="#DC2626" />
      <rect x="72" y="35" width="76" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="72" y="41" width="60" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="72" y="47" width="70" height="2.5" rx="1" fill="#E2E8F0" />
      {/* Divider */}
      <rect x="24" y="62" width="124" height="1" fill="#E2E8F0" />
      {/* Expérience */}
      <rect x="24" y="68" width="55" height="4" rx="1" fill="#DC2626" />
      <rect x="24" y="76" width="85" height="3" rx="1" fill="#1E293B" />
      <rect x="24" y="82" width="55" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="110" y="76" width="38" height="2.5" rx="1" fill="#E2E8F0" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="24" y={89 + i * 6} width={124 - i * 18} height="2" rx="1" fill="#F1F5F9" />
      ))}
      {/* Formation */}
      <rect x="24" y="112" width="40" height="4" rx="1" fill="#DC2626" />
      <rect x="24" y="120" width="90" height="3" rx="1" fill="#1E293B" />
      <rect x="24" y="126" width="60" height="2.5" rx="1" fill="#94A3B8" />
      {/* Compétences */}
      <rect x="24" y="138" width="50" height="4" rx="1" fill="#DC2626" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="24" y={146 + i * 9} width={124} height="5" rx="2.5" fill="#F8FAFC" />
          <rect x="24" y={146 + i * 9} width={124 * [0.9, 0.75, 0.85, 0.65][i]} height="5" rx="2.5" fill="#DBEAFE" />
        </g>
      ))}
    </svg>
  )
}

function ResumePreviewJapanese() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* Japanese red accent */}
      <rect x="0" y="0" width="160" height="3" fill="#DC2626" />
      {/* Title box */}
      <rect x="12" y="8" width="136" height="12" rx="1" fill="none" stroke="#1E293B" strokeWidth="1" />
      <rect x="12" y="8" width="136" height="12" rx="1" fill="#FEF2F2" />
      <rect x="40" y="11" width="80" height="6" rx="1" fill="#DC2626" opacity="0.7" />
      {/* Photo box */}
      <rect x="118" y="24" width="30" height="36" rx="1" fill="none" stroke="#CBD5E1" strokeWidth="0.5" />
      <rect x="118" y="24" width="30" height="36" rx="1" fill="#F8FAFC" />
      <circle cx="133" cy="36" r="8" fill="#E2E8F0" />
      <rect x="122" y="47" width="22" height="10" rx="1" fill="#E2E8F0" />
      {/* Personal grid */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x="12" y={24 + i * 7} width="30" height="6" rx="0.5" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.3" />
          <rect x="42" y={24 + i * 7} width="74" height="6" rx="0.5" fill="none" stroke="#E2E8F0" strokeWidth="0.3" />
          <rect x="46" y={26 + i * 7} width={50 - i * 5} height="2.5" rx="1" fill="#475569" />
        </g>
      ))}
      {/* Divider */}
      <rect x="12" y="64" width="136" height="1" fill="#1E293B" />
      {/* 職歴 (Work History) */}
      <rect x="12" y="68" width="30" height="4" rx="1" fill="#DC2626" opacity="0.8" />
      {[0, 1].map((j) => (
        <g key={j}>
          <rect x="12" y={76 + j * 22} width="40" height="2.5" rx="1" fill="#94A3B8" />
          <rect x="56" y={76 + j * 22} width="92" height="2.5" rx="1" fill="#1E293B" />
          <rect x="56" y={81 + j * 22} width="80" height="2" rx="1" fill="#E2E8F0" />
          <rect x="56" y={86 + j * 22} width="70" height="2" rx="1" fill="#E2E8F0" />
        </g>
      ))}
      {/* 学歴 (Education) */}
      <rect x="12" y="124" width="136" height="1" fill="#E2E8F0" />
      <rect x="12" y="128" width="30" height="4" rx="1" fill="#DC2626" opacity="0.8" />
      <rect x="12" y="136" width="40" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="56" y="136" width="92" height="2.5" rx="1" fill="#1E293B" />
      <rect x="56" y="142" width="80" height="2" rx="1" fill="#E2E8F0" />
      {/* 資格 (Qualifications) */}
      <rect x="12" y="152" width="136" height="1" fill="#E2E8F0" />
      <rect x="12" y="156" width="30" height="4" rx="1" fill="#DC2626" opacity="0.8" />
      <rect x="12" y="164" width="136" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="170" width="100" height="2.5" rx="1" fill="#E2E8F0" />
    </svg>
  )
}

function ResumePreviewSpanish() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* Warm header gradient */}
      <rect x="0" y="0" width="160" height="55" fill="#C2410C" />
      <rect x="0" y="52" width="160" height="4" fill="#FBBF24" />
      {/* Photo circle */}
      <circle cx="130" cy="26" r="16" fill="rgba(255,255,255,0.15)" />
      <circle cx="130" cy="26" r="12" fill="rgba(255,255,255,0.9)" />
      {/* Name */}
      <rect x="12" y="10" width="95" height="9" rx="2" fill="rgba(255,255,255,0.95)" />
      <rect x="12" y="23" width="65" height="5" rx="1.5" fill="#FBBF24" />
      <rect x="12" y="32" width="40" height="2.5" rx="1" fill="rgba(255,255,255,0.6)" />
      <rect x="57" y="32" width="40" height="2.5" rx="1" fill="rgba(255,255,255,0.6)" />
      <rect x="12" y="38" width="55" height="2.5" rx="1" fill="rgba(255,255,255,0.5)" />
      {/* Perfil Profesional */}
      <rect x="12" y="66" width="72" height="5" rx="1" fill="#C2410C" />
      <rect x="12" y="75" width="136" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="81" width="120" height="2.5" rx="1" fill="#E2E8F0" />
      {/* Experiencia */}
      <rect x="12" y="93" width="58" height="5" rx="1" fill="#C2410C" />
      <rect x="12" y="102" width="80" height="3.5" rx="1" fill="#1E293B" />
      <rect x="12" y="109" width="55" height="2.5" rx="1" fill="#C2410C" opacity="0.6" />
      <rect x="106" y="102" width="42" height="2.5" rx="1" fill="#E2E8F0" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="12" y={116 + i * 6} width={136 - i * 18} height="2" rx="1" fill="#F1F5F9" />
      ))}
      {/* Second job */}
      <rect x="12" y="138" width="70" height="3.5" rx="1" fill="#1E293B" />
      <rect x="12" y="145" width="50" height="2.5" rx="1" fill="#C2410C" opacity="0.6" />
      {[0, 1].map((i) => (
        <rect key={i} x="12" y={152 + i * 6} width={136 - i * 25} height="2" rx="1" fill="#F1F5F9" />
      ))}
      {/* Formacion */}
      <rect x="12" y="168" width="50" height="5" rx="1" fill="#C2410C" />
      <rect x="12" y="177" width="90" height="3" rx="1" fill="#1E293B" />
      <rect x="12" y="183" width="65" height="2.5" rx="1" fill="#94A3B8" />
      {/* Idiomas */}
      <rect x="12" y="195" width="40" height="5" rx="1" fill="#C2410C" />
      {["ES", "EN", "FR"].map((l, i) => (
        <rect key={l} x={12 + i * 32} y="204" width="28" height="7" rx="3.5" fill={i === 0 ? "#FEF3C7" : "#F8FAFC"} />
      ))}
    </svg>
  )
}

function ResumePreviewPortuguese() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* Green header */}
      <rect x="0" y="0" width="160" height="50" fill="#166534" />
      <rect x="0" y="47" width="160" height="4" fill="#FBBF24" />
      {/* Name */}
      <rect x="12" y="10" width="85" height="9" rx="2" fill="rgba(255,255,255,0.95)" />
      <rect x="12" y="23" width="60" height="5" rx="1.5" fill="rgba(255,255,255,0.7)" />
      <rect x="12" y="32" width="90" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
      {/* Foto */}
      <rect x="120" y="8" width="32" height="40" rx="3" fill="rgba(255,255,255,0.15)" />
      <circle cx="136" cy="22" r="10" fill="rgba(255,255,255,0.3)" />
      {/* Resumo */}
      <rect x="12" y="62" width="40" height="4" rx="1" fill="#166534" />
      <rect x="12" y="70" width="136" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="76" width="115" height="2.5" rx="1" fill="#E2E8F0" />
      {/* Experiência */}
      <rect x="12" y="88" width="58" height="4" rx="1" fill="#166534" />
      <rect x="12" y="96" width="80" height="3.5" rx="1" fill="#1E293B" />
      <rect x="12" y="102" width="55" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="106" y="96" width="42" height="2.5" rx="1" fill="#E2E8F0" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="12" y={109 + i * 6} width={136 - i * 20} height="2" rx="1" fill="#F1F5F9" />
      ))}
      {/* Formação */}
      <rect x="12" y="132" width="50" height="4" rx="1" fill="#166534" />
      <rect x="12" y="140" width="90" height="3" rx="1" fill="#1E293B" />
      <rect x="12" y="146" width="65" height="2.5" rx="1" fill="#94A3B8" />
      {/* Competências */}
      <rect x="12" y="160" width="58" height="4" rx="1" fill="#166534" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="12" y={168 + i * 9} width="136" height="5" rx="2.5" fill="#F0FDF4" />
          <rect x="12" y={168 + i * 9} width={136 * [0.9, 0.75, 0.85, 0.7][i]} height="5" rx="2.5" fill="#BBF7D0" />
        </g>
      ))}
    </svg>
  )
}

function ResumePreviewGlobal() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" style={{ background: "#fff" }}>
      {/* Multi-color international accent */}
      <rect x="0" y="0" width="40" height="4" fill="#3B82F6" />
      <rect x="40" y="0" width="40" height="4" fill="#10B981" />
      <rect x="80" y="0" width="40" height="4" fill="#F59E0B" />
      <rect x="120" y="0" width="40" height="4" fill="#EF4444" />
      {/* Globe icon representation */}
      <circle cx="24" cy="24" r="12" fill="none" stroke="#3B82F6" strokeWidth="1" />
      <ellipse cx="24" cy="24" rx="6" ry="12" fill="none" stroke="#3B82F6" strokeWidth="0.7" />
      <line x1="12" y1="24" x2="36" y2="24" stroke="#3B82F6" strokeWidth="0.7" />
      {/* Name */}
      <rect x="44" y="14" width="90" height="8" rx="2" fill="#0F172A" />
      <rect x="44" y="26" width="65" height="4" rx="1.5" fill="#3B82F6" />
      <rect x="44" y="33" width="104" height="2.5" rx="1" fill="#E2E8F0" />
      {/* Language flags row */}
      {["🇺🇸", "🇩🇪", "🇫🇷", "🇯🇵"].map((_, i) => (
        <rect key={i} x={12 + i * 22} y="46" width="18" height="8" rx="4" fill={["#DBEAFE", "#F1F5F9", "#FEF3C7", "#FEE2E2"][i]} />
      ))}
      {/* Divider */}
      <rect x="12" y="60" width="136" height="1" fill="#E2E8F0" />
      {/* Profile */}
      <rect x="12" y="66" width="40" height="4" rx="1" fill="#3B82F6" />
      <rect x="12" y="74" width="136" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="80" width="115" height="2.5" rx="1" fill="#E2E8F0" />
      {/* Experience */}
      <rect x="12" y="92" width="56" height="4" rx="1" fill="#3B82F6" />
      <rect x="12" y="100" width="80" height="3.5" rx="1" fill="#1E293B" />
      <rect x="12" y="106" width="55" height="2.5" rx="1" fill="#94A3B8" />
      <rect x="106" y="100" width="42" height="2.5" rx="1" fill="#E2E8F0" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="12" y={113 + i * 6} width={136 - i * 20} height="2" rx="1" fill="#F1F5F9" />
      ))}
      {/* International section */}
      <rect x="12" y="134" width="70" height="4" rx="1" fill="#3B82F6" />
      <rect x="12" y="142" width="136" height="2.5" rx="1" fill="#E2E8F0" />
      <rect x="12" y="148" width="100" height="2.5" rx="1" fill="#E2E8F0" />
      {/* Languages */}
      <rect x="12" y="162" width="50" height="4" rx="1" fill="#3B82F6" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={12 + i * 36} y="170" width="30" height="10" rx="5" fill={["#DBEAFE", "#DCFCE7", "#FEF3C7", "#FEE2E2"][i]} />
      ))}
      {/* Education */}
      <rect x="12" y="190" width="44" height="4" rx="1" fill="#3B82F6" />
      <rect x="12" y="198" width="90" height="3" rx="1" fill="#1E293B" />
      <rect x="12" y="204" width="65" height="2.5" rx="1" fill="#94A3B8" />
    </svg>
  )
}

const PREVIEW_COMPONENTS: Record<string, React.ReactNode> = {
  Modern: <ResumePreviewModern />,
  Classic: <ResumePreviewClassic />,
  Executive: <ResumePreviewExecutive />,
  Minimal: <ResumePreviewMinimal />,
  Creative: <ResumePreviewCreative />,
  "ATS Friendly": <ResumePreviewATS />,
  "European CV": <ResumePreviewEuropean />,
  "German Lebenslauf": <ResumePreviewGerman />,
  "French CV": <ResumePreviewFrench />,
  "Japanese Rirekisho": <ResumePreviewJapanese />,
  "Spanish CV": <ResumePreviewSpanish />,
  "Portuguese CV": <ResumePreviewPortuguese />,
  "Global Professional": <ResumePreviewGlobal />,
}

// Fallback for "Global Professional" or any unmapped template
function ResumePreviewDefault({ gradient }: { gradient: string }) {
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <div className="space-y-2 w-[80%]">
        {[80, 65, 90, 55, 70].map((w, i) => (
          <div key={i} className="h-2 bg-white/30 rounded-full" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

// ── Upgrade modal ─────────────────────────────────────────────────────────────

const PLAN_COMPARISON = [
  { plan: "Free", price: "$0", templates: "1 (Modern)", ai: "5/mo", color: "slate" },
  { plan: "Basic", price: "$9/mo", templates: "3 templates", ai: "50/mo", color: "blue" },
  { plan: "Pro", price: "$15/mo", templates: "8 templates", ai: "Unlimited", color: "indigo", popular: true },
  { plan: "Global", price: "$29/mo", templates: "All 12", ai: "Unlimited + AI translate", color: "amber" },
]

function UpgradeModal({ open, onClose, templateName }: { open: boolean; onClose: () => void; templateName: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <Award className="h-6 w-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Unlock {templateName}</h2>
          <p className="text-slate-500 text-sm mt-1">Upgrade your plan to access premium templates and more</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {PLAN_COMPARISON.map((p) => (
            <div
              key={p.plan}
              className={cn(
                "rounded-xl border p-3 text-center relative",
                p.popular ? "border-blue-500 shadow-md shadow-blue-100" : "border-slate-200"
              )}
            >
              {p.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">MOST POPULAR</span>
                </div>
              )}
              <p className="font-bold text-sm text-slate-900 mt-1">{p.plan}</p>
              <p className="text-blue-600 font-semibold text-sm">{p.price}</p>
              <p className="text-[10px] text-slate-500 mt-1">{p.templates}</p>
              <p className="text-[10px] text-slate-400">{p.ai} AI credits</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-6">
          {[
            { icon: <Zap className="h-4 w-4 text-blue-500" />, text: "Unlimited AI-powered resume writing" },
            { icon: <Globe2 className="h-4 w-4 text-emerald-500" />, text: "Localized templates for 12+ countries" },
            { icon: <Star className="h-4 w-4 text-amber-500" />, text: "ATS score checker and optimization" },
            { icon: <Users className="h-4 w-4 text-purple-500" />, text: "Used by 50,000+ job seekers worldwide" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 text-sm text-slate-700">
              {item.icon}{item.text}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/billing" className="flex-1" onClick={onClose}>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              View Plans <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Button variant="outline" onClick={onClose} className="flex-1">Stay on Free</Button>
        </div>
      </div>
    </div>
  )
}

// ── Preview modal ─────────────────────────────────────────────────────────────

function PreviewModal({
  template,
  isLocked,
  onClose,
  onUpgrade,
}: {
  template: { id: string; name: string; isPremium: boolean } | null
  isLocked: boolean
  onClose: () => void
  onUpgrade: () => void
}) {
  if (!template) return null
  const meta = TEMPLATE_META[template.name]
  const preview = PREVIEW_COMPONENTS[template.name]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col sm:flex-row overflow-hidden max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-600 bg-white rounded-full p-0.5">
          <X className="h-5 w-5" />
        </button>

        {/* Preview pane */}
        <div className="sm:w-[46%] bg-slate-100 flex items-center justify-center p-6 shrink-0">
          <div className="w-full aspect-[160/220] shadow-lg rounded-sm overflow-hidden">
            {preview ?? (
              <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-sm">Preview</div>
            )}
          </div>
        </div>

        {/* Info pane */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900">{template.name}</h2>
              {meta?.targetCountry && <span className="text-2xl">{meta.targetCountry}</span>}
            </div>
            {meta?.badge && (
              <span className={`inline-block text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 ${meta.badgeColor}`}>
                {meta.badge}
              </span>
            )}
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{meta?.desc}</p>

            {meta?.usedBy && (
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <Users className="h-4 w-4" />
                <span><strong className="text-slate-800">{meta.usedBy}</strong> job seekers use this template</span>
              </div>
            )}

            {meta?.bestFor && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Best for</p>
                <div className="flex flex-wrap gap-1.5">
                  {meta.bestFor.map((b) => (
                    <span key={b} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">{b}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Available languages</p>
              <div className="flex flex-wrap gap-1.5">
                {(meta?.langs ?? ["EN"]).map((l) => (
                  <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{l}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {isLocked ? (
              <>
                <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={onUpgrade}>
                  <Award className="h-4 w-4 mr-2" />Upgrade to Unlock
                </Button>
                <Button variant="outline" className="w-full" onClick={onClose}>Continue with free templates</Button>
              </>
            ) : (
              <>
                <Link href={`/dashboard/builder/new?template=${encodeURIComponent(template.name.toLowerCase().replace(/\s+/g, "-"))}`} className="w-full block" onClick={onClose}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Use This Template</Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={onClose}>Back to Gallery</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Template {
  id: string
  name: string
  thumbnail: string | null
  isPremium: boolean
}

interface Props {
  templates: Template[]
  hasFullAccess: boolean
  currentPlan: string
}

export function TemplatesClient({ templates, hasFullAccess, currentPlan }: Props) {
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; feature: string }>({ open: false, feature: "" })
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [activeCategory, setActiveCategory] = useState("All")
  const [search, setSearch] = useState("")

  const filtered = templates.filter((t) => {
    const meta = TEMPLATE_META[t.name]
    const cat = meta?.category ?? "Universal"
    const matchesCategory = activeCategory === "All" || cat === activeCategory
    const matchesSearch =
      search === "" ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (meta?.desc ?? "").toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const previewIsLocked = previewTemplate ? previewTemplate.isPremium && !hasFullAccess : false

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Resume Templates</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {templates.length} professional templates — crafted for ATS and global employers.
        </p>
      </div>

      {currentPlan === "FREE" && (
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">You&apos;re on the Free plan</p>
              <p className="text-xs text-amber-700 mt-0.5">Only the Modern template is unlocked. Upgrade to access all 12 premium templates.</p>
            </div>
          </div>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shrink-0 ml-4" onClick={() => setUpgradeModal({ open: true, feature: "Premium Templates" })}>
            Upgrade
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "h-10 px-3 rounded-xl text-sm font-medium transition-all",
                activeCategory === cat ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Search className="h-10 w-10 mb-3" />
          <p className="font-medium text-slate-600">No templates found</p>
          <p className="text-sm mt-1">Try adjusting your search or category filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((template) => {
            const isLocked = template.isPremium && !hasFullAccess
            const meta = TEMPLATE_META[template.name] ?? { category: "Standard", langs: ["EN"], desc: "", bestFor: [] }
            const preview = PREVIEW_COMPONENTS[template.name]

            return (
              <div
                key={template.id}
                className={cn(
                  "group rounded-2xl border bg-white overflow-hidden transition-all duration-200 cursor-pointer",
                  isLocked ? "border-slate-200 hover:border-amber-300 hover:shadow-md" : "border-slate-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5"
                )}
                onClick={() => setPreviewTemplate(template)}
              >
                {/* Visual preview */}
                <div className="h-48 relative overflow-hidden bg-slate-50">
                  {preview ? (
                    <div className="absolute inset-0">{preview}</div>
                  ) : (
                    <ResumePreviewDefault gradient="from-slate-400 to-slate-600" />
                  )}

                  {/* Country badge */}
                  {meta.targetCountry && (
                    <div className="absolute top-2 left-2 text-lg leading-none">{meta.targetCountry}</div>
                  )}

                  {/* Plan badge */}
                  <div className="absolute top-2 right-2">
                    {!template.isPremium ? (
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Free</span>
                    ) : (
                      <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Pro</span>
                    )}
                  </div>

                  {/* Popularity badge */}
                  {meta.badge && !meta.targetCountry && (
                    <div className="absolute bottom-2 left-2">
                      <span className={`${meta.badgeColor} text-white text-[9px] font-bold px-2 py-0.5 rounded-full`}>{meta.badge}</span>
                    </div>
                  )}

                  {/* Lock hover overlay */}
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity",
                    isLocked ? "bg-slate-900/15 opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100 bg-blue-600/10"
                  )}>
                    <div className={cn("rounded-xl px-4 py-2 flex items-center gap-2 shadow-md text-sm font-semibold",
                      isLocked ? "bg-white/95 text-slate-800" : "bg-blue-600 text-white"
                    )}>
                      {isLocked ? <><Lock className="h-4 w-4" />Upgrade to unlock</> : <>Preview template</>}
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm text-slate-900">{template.name}</h3>
                    {!isLocked && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-snug line-clamp-2">{meta.desc}</p>
                  {meta.usedBy && (
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />{meta.usedBy} users
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {meta.langs.slice(0, 4).map((lang) => (
                      <span key={lang} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{lang}</span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-4 pb-4">
                  {isLocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                      onClick={(e) => { e.stopPropagation(); setUpgradeModal({ open: true, feature: `${template.name} Template` }) }}
                    >
                      <Lock className="h-3 w-3 mr-1.5" />Unlock Template
                    </Button>
                  ) : (
                    <Link
                      href={`/dashboard/builder/new?template=${encodeURIComponent(template.name.toLowerCase().replace(/\s+/g, "-"))}`}
                      className="w-full block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">Use Template</Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <PreviewModal
        template={previewTemplate}
        isLocked={previewIsLocked}
        onClose={() => setPreviewTemplate(null)}
        onUpgrade={() => { setPreviewTemplate(null); setUpgradeModal({ open: true, feature: previewTemplate?.name ?? "Premium Template" }) }}
      />

      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: "" })}
        templateName={upgradeModal.feature}
      />
    </div>
  )
}
