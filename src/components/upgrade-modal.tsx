"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Lock, Loader2, Zap } from "lucide-react"

const PLANS = [
  {
    name: "BASIC",
    label: "Basic",
    price: "$9/mo",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || "price_basic_dummy",
    features: ["3 Templates", "1 Language", "Clean PDF"],
    highlight: false,
  },
  {
    name: "PRO",
    label: "Pro",
    price: "$15/mo",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || "price_pro_dummy",
    features: ["8 Templates", "3 Languages", "AI Assistant", "ATS Checker"],
    highlight: true,
  },
  {
    name: "GLOBAL",
    label: "Global",
    price: "$29/mo",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GLOBAL || "price_global_dummy",
    features: ["All Templates", "All Languages", "AI Translation"],
    highlight: false,
  },
]

interface Props {
  open: boolean
  onClose: () => void
  featureName: string
}

export function UpgradeModal({ open, onClose, featureName }: Props) {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)

  const handleUpgrade = async (priceId: string) => {
    setLoadingPriceId(priceId)
    try {
      const { createCheckoutSession } = await import("@/actions/stripe")
      await createCheckoutSession(priceId)
    } catch {
      setLoadingPriceId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5 text-slate-400" />
            Unlock {featureName}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Upgrade your plan to access this feature and much more.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-4 flex flex-col ${
                plan.highlight
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                  : "bg-white border-slate-200"
              }`}
            >
              {plan.highlight && (
                <span className="text-[10px] bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded-full self-start mb-2 uppercase tracking-wide">
                  Most Popular
                </span>
              )}
              <p className={`font-semibold ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.label}</p>
              <p className={`text-lg font-bold mb-3 ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</p>
              <ul className="space-y-1.5 flex-1 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-1.5 text-xs ${plan.highlight ? "text-blue-100" : "text-slate-600"}`}>
                    <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${plan.highlight ? "text-blue-200" : "text-blue-500"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                className={`w-full ${plan.highlight ? "bg-white text-blue-600 hover:bg-slate-100" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                onClick={() => handleUpgrade(plan.priceId)}
                disabled={loadingPriceId !== null}
              >
                {loadingPriceId === plan.priceId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    Upgrade
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center text-xs text-slate-400 mt-2">
          Secure payment via Stripe · Cancel anytime
        </div>
      </DialogContent>
    </Dialog>
  )
}
