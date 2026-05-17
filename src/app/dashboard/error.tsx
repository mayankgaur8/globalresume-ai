"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
      <p className="text-slate-500 text-sm mb-6 max-w-sm">
        We hit an unexpected error loading your dashboard. Please try again.
      </p>
      <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">
        Try again
      </Button>
    </div>
  )
}
