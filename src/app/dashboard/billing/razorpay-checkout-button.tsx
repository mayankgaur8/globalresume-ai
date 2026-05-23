"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Zap } from "lucide-react"

interface Props {
  planName: string
  planLabel: string
  highlight?: boolean
  size?: "default" | "sm"
  onSuccess?: () => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number | string
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  modal: { ondismiss: () => void }
  theme: { color: string }
}

interface RazorpayInstance {
  open(): void
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function RazorpayCheckoutButton({ planName, planLabel, highlight, size = "default", onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) throw new Error("Could not load payment script. Check your connection.")

      const orderRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName }),
      })

      if (!orderRes.ok) {
        const data = (await orderRes.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to create payment order")
      }

      const order = (await orderRes.json()) as {
        orderId: string
        amount: number | string
        currency: string
        keyId: string
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "GlobalResumeAI",
          description: `${planLabel} Plan`,
          order_id: order.orderId,
          handler: async (response: RazorpayResponse) => {
            try {
              const verifyRes = await fetch("/api/payments/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              })

              if (!verifyRes.ok) {
                const data = (await verifyRes.json()) as { error?: string }
                throw new Error(data.error ?? "Payment verification failed")
              }

              onSuccess?.()
              router.push("/dashboard/billing?success=true")
              router.refresh()
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false)
              resolve()
            },
          },
          theme: { color: "#2563eb" },
        })
        rzp.open()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-1.5">
      <Button
        size={size}
        className={`w-full ${highlight ? "bg-white text-blue-600 hover:bg-slate-100" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} animate-spin mr-2`} />
        ) : (
          <Zap className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} mr-2`} />
        )}
        Upgrade to {planLabel}
      </Button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}
