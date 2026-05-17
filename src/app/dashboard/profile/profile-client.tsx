"use client"

import { useState } from "react"
import {
  User, Eye, Link as LinkIcon, Share2, CheckCircle2, Circle,
  Globe, Briefcase, GraduationCap, Code, TrendingUp, Copy,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface BoldProfileClientProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const COMPLETION_ITEMS = [
  { label: "Profile photo", icon: <User className="h-4 w-4" />, done: false, points: 10 },
  { label: "Professional headline", icon: <Briefcase className="h-4 w-4" />, done: false, points: 15 },
  { label: "Work experience", icon: <TrendingUp className="h-4 w-4" />, done: false, points: 25 },
  { label: "Education", icon: <GraduationCap className="h-4 w-4" />, done: false, points: 15 },
  { label: "Skills (5+)", icon: <Code className="h-4 w-4" />, done: false, points: 20 },
  { label: "Public resume linked", icon: <Globe className="h-4 w-4" />, done: false, points: 15 },
]

const MOCK_STATS = [
  { label: "Profile views", value: "247", change: "+12 this week", positive: true },
  { label: "Resume downloads", value: "18", change: "+3 this week", positive: true },
  { label: "Search appearances", value: "1,340", change: "+89 this week", positive: true },
  { label: "Recruiter contacts", value: "4", change: "this month", positive: false },
]

export function BoldProfileClient({ user }: BoldProfileClientProps) {
  const { toast } = useToast()
  const [includeInResume, setIncludeInResume] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const profileSlug = user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "yourname"
  const profileUrl = `globalresumeai.com/p/${profileSlug}`
  const completedCount = 0 // In production: count from actual profile data
  const completionPct = Math.round((completedCount / COMPLETION_ITEMS.length) * 100)
  const initials = user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U"

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${profileUrl}`)
    toast("Profile link copied!", "success")
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Bold Profile</h1>
          <p className="text-slate-500 mt-1 text-sm">Your public candidate profile — get discovered by recruiters</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-200 text-sm" onClick={copyLink}>
            <LinkIcon className="h-4 w-4 mr-2" />Copy Link
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-sm">
            <Eye className="h-4 w-4 mr-2" />Preview Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Profile card + settings */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <div className="px-5 pb-5">
              <div className="flex items-end justify-between -mt-8 mb-3">
                <Avatar className="h-16 w-16 border-4 border-white ring-2 ring-slate-100">
                  <AvatarImage src={user.image || ""} />
                  <AvatarFallback className="text-xl font-bold bg-blue-100 text-blue-700">{initials}</AvatarFallback>
                </Avatar>
                <Badge className={cn("text-xs font-semibold", isPublic ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                  {isPublic ? "● Public" : "○ Private"}
                </Badge>
              </div>
              <h2 className="font-bold text-slate-900 text-lg">{user.name || "Your Name"}</h2>
              <p className="text-slate-500 text-sm mt-0.5">Add your professional headline</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {profileUrl}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                {/* Public toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Profile Visibility</p>
                    <p className="text-xs text-slate-400">Recruiters can find you</p>
                  </div>
                  <button
                    onClick={() => { setIsPublic((v) => !v); toast(isPublic ? "Profile set to private" : "Profile is now public", "info") }}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      isPublic ? "bg-blue-600" : "bg-slate-200"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                      isPublic ? "translate-x-5" : "translate-x-0.5"
                    )} />
                  </button>
                </div>

                {/* Include in resume toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Include in Resume</p>
                    <p className="text-xs text-slate-400">Add profile link to your resume</p>
                  </div>
                  <button
                    onClick={() => { setIncludeInResume((v) => !v); toast(includeInResume ? "Removed from resume" : "Profile link added to resume", "success") }}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      includeInResume ? "bg-blue-600" : "bg-slate-200"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                      includeInResume ? "translate-x-5" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Share */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-blue-600" />Share Your Profile
            </h3>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
              <Globe className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 flex-1 truncate">{profileUrl}</span>
              <button onClick={copyLink} className="text-blue-600 hover:text-blue-700">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button variant="outline" size="sm" className="border-slate-200 text-xs">
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" className="border-slate-200 text-xs">
                Twitter / X
              </Button>
            </div>
          </div>
        </div>

        {/* Center: Stats */}
        <div className="space-y-4">
          {/* Stats grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />Profile Analytics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {MOCK_STATS.map((stat) => (
                <div key={stat.label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{stat.label}</p>
                  <p className={cn("text-xs mt-1", stat.positive ? "text-emerald-600" : "text-slate-400")}>
                    {stat.positive && "+"}{stat.change}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade prompt */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-blue-200" />
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Unlock Insights</span>
            </div>
            <h3 className="font-bold mb-1">See who viewed your profile</h3>
            <p className="text-blue-100 text-sm mb-4">Know exactly which companies and recruiters checked you out.</p>
            <Button size="sm" className="w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold">
              Upgrade to Pro
            </Button>
          </div>
        </div>

        {/* Right: Completion checklist */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900 text-sm">Profile Completion</h3>
              <span className="text-xs font-bold text-slate-500">{completionPct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                style={{ width: `${completionPct || 5}%` }}
              />
            </div>
            <div className="space-y-3">
              {COMPLETION_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    item.done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                  )}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", item.done ? "text-slate-400 line-through" : "text-slate-700")}>
                      {item.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400">+{item.points}%</span>
                    {item.done
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <Circle className="h-4 w-4 text-slate-300" />
                    }
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
              Complete Your Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
