"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink } from "lucide-react"
import { createPortalSession } from "@/actions/stripe"

export function PortalButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await createPortalSession()
    } catch (err) {
      setLoading(false)
      alert(err instanceof Error ? err.message : "Could not open billing portal")
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="border-blue-200 text-blue-700 hover:bg-blue-100"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
      )}
      Manage subscription
    </Button>
  )
}
