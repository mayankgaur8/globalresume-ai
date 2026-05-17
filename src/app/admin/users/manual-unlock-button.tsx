"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck } from "lucide-react"

export function ManualUnlockButton({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleUpgrade = async () => {
    if (!confirm(`Upgrade ${userEmail} to PRO?`)) return
    setLoading(true)
    const res = await fetch("/api/admin/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan: "PRO" }),
    })
    setLoading(false)
    if (res.ok) setDone(true)
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
      onClick={handleUpgrade}
      disabled={loading || done}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
      )}
      {done ? "Upgraded" : "Unlock PRO"}
    </Button>
  )
}
