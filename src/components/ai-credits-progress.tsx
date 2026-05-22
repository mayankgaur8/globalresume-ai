"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Zap, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface CreditStatus {
  used: number
  limit: number
  plan: string
}

export function AICreditsProgress() {
  const [status, setStatus] = useState<CreditStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ai/credits")
      .then((r) => r.json())
      .then((d: CreditStatus) => setStatus(d))
      .catch(() => {/* silently degrade */})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !status) return null

  const pct = Math.min(100, Math.round((status.used / status.limit) * 100))
  const remaining = Math.max(0, status.limit - status.used)
  const isWarning = pct >= 80
  const isExhausted = remaining === 0

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Zap className="h-4 w-4 text-amber-500" />
          AI Credits
        </div>
        <Badge
          variant="outline"
          className={
            isExhausted
              ? "border-red-300 text-red-600"
              : isWarning
              ? "border-amber-300 text-amber-700"
              : "border-slate-200 text-slate-600"
          }
        >
          {status.plan}
        </Badge>
      </div>

      <Progress
        value={pct}
        className={`h-2 ${isExhausted ? "[&>div]:bg-red-500" : isWarning ? "[&>div]:bg-amber-500" : "[&>div]:bg-indigo-500"}`}
      />

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {isExhausted ? (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <AlertTriangle className="h-3 w-3" /> No credits remaining
            </span>
          ) : (
            `${remaining} of ${status.limit} credits remaining`
          )}
        </span>
        <span>{pct}% used</span>
      </div>

      {(isWarning || isExhausted) && (
        <Link
          href="/dashboard/billing"
          className="mt-1 flex h-7 w-full items-center justify-center rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          {isExhausted ? "Upgrade to unlock AI" : "Get more credits →"}
        </Link>
      )}
    </div>
  )
}
