"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Zap } from "lucide-react"
import { createCheckoutSession } from "@/actions/stripe"

interface Props {
  priceId: string
  planName: string
  highlight?: boolean
}

export function CheckoutButton({ priceId, planName, highlight }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await createCheckoutSession(priceId)
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button
      className={`w-full ${highlight ? "bg-white text-blue-600 hover:bg-slate-100" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Zap className="h-4 w-4 mr-2" />
      )}
      Upgrade to {planName}
    </Button>
  )
}
