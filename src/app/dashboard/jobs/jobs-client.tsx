"use client"

import { useState } from "react"
import {
  Search, MapPin, Briefcase, Clock, DollarSign, Bookmark,
  BookmarkCheck, ExternalLink, Filter, Globe, Wifi,
  ChevronRight, Star, Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"

const MOCK_JOBS = [
  {
    id: "1",
    title: "Senior Software Engineer",
    company: "TechCorp Berlin",
    location: "Berlin, Germany",
    country: "DE",
    type: "Full-time",
    remote: "Hybrid",
    salary: "€80,000 – €110,000",
    posted: "2d ago",
    logo: "TC",
    logoColor: "bg-blue-600",
    tags: ["React", "TypeScript", "Node.js"],
    match: 92,
    featured: true,
  },
  {
    id: "2",
    title: "Product Manager",
    company: "StartupHub",
    location: "London, UK",
    country: "GB",
    type: "Full-time",
    remote: "Remote",
    salary: "£70,000 – £90,000",
    posted: "1d ago",
    logo: "SH",
    logoColor: "bg-violet-600",
    tags: ["Product Strategy", "Agile", "B2B SaaS"],
    match: 78,
    featured: false,
  },
  {
    id: "3",
    title: "UX Designer",
    company: "DesignStudio Paris",
    location: "Paris, France",
    country: "FR",
    type: "Contract",
    remote: "On-site",
    salary: "€55,000 – €70,000",
    posted: "3d ago",
    logo: "DS",
    logoColor: "bg-pink-600",
    tags: ["Figma", "User Research", "Prototyping"],
    match: 85,
    featured: false,
  },
  {
    id: "4",
    title: "Data Scientist",
    company: "Analytics Co",
    location: "Amsterdam, Netherlands",
    country: "NL",
    type: "Full-time",
    remote: "Remote",
    salary: "€75,000 – €95,000",
    posted: "5h ago",
    logo: "AC",
    logoColor: "bg-emerald-600",
    tags: ["Python", "Machine Learning", "SQL"],
    match: 71,
    featured: true,
  },
  {
    id: "5",
    title: "Marketing Manager",
    company: "GrowthBrand",
    location: "Madrid, Spain",
    country: "ES",
    type: "Full-time",
    remote: "Hybrid",
    salary: "€45,000 – €60,000",
    posted: "1w ago",
    logo: "GB",
    logoColor: "bg-amber-600",
    tags: ["SEO", "Content Marketing", "Analytics"],
    match: 64,
    featured: false,
  },
  {
    id: "6",
    title: "DevOps Engineer",
    company: "CloudSystems",
    location: "Remote",
    country: "US",
    type: "Full-time",
    remote: "Remote",
    salary: "$100,000 – $130,000",
    posted: "2d ago",
    logo: "CS",
    logoColor: "bg-slate-700",
    tags: ["AWS", "Kubernetes", "CI/CD"],
    match: 88,
    featured: false,
  },
]

const COUNTRIES = ["All Countries", "Germany", "UK", "France", "Netherlands", "Spain", "USA", "Remote"]
const JOB_TYPES = ["All Types", "Full-time", "Contract", "Part-time"]
const REMOTE_OPTIONS = ["Any", "Remote", "Hybrid", "On-site"]

export function JobsClient() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [country, setCountry] = useState("All Countries")
  const [jobType, setJobType] = useState("All Types")
  const [remoteFilter, setRemoteFilter] = useState("Any")
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const toggleSave = (id: string, title: string) => {
    const next = new Set(saved)
    if (next.has(id)) {
      next.delete(id)
      toast(`Removed "${title}" from saved`, "info")
    } else {
      next.add(id)
      toast(`Saved "${title}"`, "success")
    }
    setSaved(next)
  }

  const filtered = MOCK_JOBS.filter((j) => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company.toLowerCase().includes(search.toLowerCase())) return false
    if (country !== "All Countries" && !j.location.includes(country) && !(country === "Remote" && j.remote === "Remote")) return false
    if (jobType !== "All Types" && j.type !== jobType) return false
    if (remoteFilter !== "Any" && j.remote !== remoteFilter) return false
    return true
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Job Search</h1>
        <p className="text-slate-500 mt-1 text-sm">Find your next role and tailor your resume with one click</p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Job title, keywords, company..."
              className="pl-9 h-11 border-slate-200"
            />
          </div>
          <div className="relative hidden sm:block">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="pl-9 pr-4 h-11 border border-slate-200 rounded-md text-sm bg-white text-slate-700 appearance-none cursor-pointer min-w-[160px]"
            >
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-5 shrink-0">
            <Search className="h-4 w-4 mr-2" />Search
          </Button>
          <Button variant="outline" className="border-slate-200 h-11 shrink-0" onClick={() => setShowFilters((v) => !v)}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Job Type</p>
              <div className="flex gap-1.5">
                {JOB_TYPES.map((t) => (
                  <button key={t} onClick={() => setJobType(t)}
                    className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                      jobType === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Work Mode</p>
              <div className="flex gap-1.5">
                {REMOTE_OPTIONS.map((r) => (
                  <button key={r} onClick={() => setRemoteFilter(r)}
                    className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                      remoteFilter === r ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-semibold">{filtered.length}</span> jobs found
          {search && <span> for &ldquo;<span className="font-semibold">{search}</span>&rdquo;</span>}
        </p>
        <p className="text-xs text-slate-400">Powered by mock data — live job API coming soon</p>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No jobs match your filters</p>
            <p className="text-sm text-slate-500 mt-1">Try broadening your search</p>
          </div>
        ) : filtered.map((job) => (
          <div key={job.id} className={cn(
            "bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-200",
            job.featured ? "border-blue-200 shadow-sm shadow-blue-50" : "border-slate-200"
          )}>
            {job.featured && (
              <div className="bg-blue-50 px-5 py-1.5 border-b border-blue-100 flex items-center gap-1.5">
                <Star className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-semibold text-blue-600">Featured Job</span>
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Company logo */}
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0", job.logoColor)}>
                  {job.logo}
                </div>

                {/* Job info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm text-slate-600">{job.company}</span>
                      </div>
                    </div>
                    {/* Match score */}
                    <div className={cn(
                      "shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl",
                      job.match >= 80 ? "bg-emerald-50" : job.match >= 60 ? "bg-amber-50" : "bg-slate-50"
                    )}>
                      <span className={cn("text-lg font-bold", job.match >= 80 ? "text-emerald-600" : job.match >= 60 ? "text-amber-600" : "text-slate-600")}>
                        {job.match}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">match</span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                    <span className="flex items-center gap-1">
                      {job.remote === "Remote" ? <Wifi className="h-3 w-3" /> : job.remote === "Hybrid" ? <Globe className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                      {job.remote}
                    </span>
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.type}</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{job.salary}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.posted}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {job.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 border-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                  onClick={() => toast("Tailoring your resume for this job...", "info")}
                >
                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                  Tailor My Resume
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-200 text-xs h-8"
                  onClick={() => toast("Generating cover letter...", "info")}
                >
                  Generate Cover Letter
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => toggleSave(job.id, job.title)}
                    className={cn("transition-colors", saved.has(job.id) ? "text-amber-500" : "text-slate-300 hover:text-slate-500")}
                  >
                    {saved.has(job.id) ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                  </button>
                  <Button size="sm" variant="ghost" className="text-xs h-8 text-slate-500">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
