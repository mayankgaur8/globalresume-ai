"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react"
import { RazorpayCheckoutButton } from "@/app/dashboard/billing/razorpay-checkout-button"

const PLANS = [
  {
    name: "BASIC" as const,
    label: "Basic",
    price: "₹799/mo",
    features: ["3 Templates", "1 Language", "Clean PDF"],
    highlight: false,
  },
  {
    name: "PRO" as const,
    label: "Pro",
    price: "₹1,299/mo",
    features: ["8 Templates", "3 Languages", "AI Assistant", "ATS Checker"],
    highlight: true,
  },
  {
    name: "GLOBAL" as const,
    label: "Global",
    price: "₹2,499/mo",
    features: ["All Templates", "All Languages", "AI Translation", "Cover Letter AI"],
    highlight: false,
  },
]

interface Props {
  open: boolean
  onClose: () => void
  featureName: string
  isAdmin?: boolean
  razorpayEnabled?: boolean
}

export function UpgradeModal({ open, onClose, featureName, isAdmin = false, razorpayEnabled = true }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isAdmin ? (
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
            ) : (
              <Lock className="h-5 w-5 text-slate-400" />
            )}
            {isAdmin ? "Admin Access" : `Unlock ${featureName}`}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? "You have admin access — all features are unlocked."
              : "Upgrade your plan to access this feature and much more."}
          </p>
        </DialogHeader>

        {isAdmin ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-indigo-600" />
            </div>
            <p className="font-semibold text-slate-900">Admin Mode — All features unlocked</p>
            <p className="text-sm text-slate-500 text-center max-w-xs">
              As an admin you already have access to every feature including{" "}
              <span className="font-medium text-slate-700">{featureName}</span>.
            </p>
          </div>
        ) : (
          <>
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
                  <p className={`font-semibold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.label}
                  </p>
                  <p className={`text-lg font-bold mb-3 ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </p>
                  <ul className="space-y-1.5 flex-1 mb-4">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className={`flex items-center gap-1.5 text-xs ${
                          plan.highlight ? "text-blue-100" : "text-slate-600"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 shrink-0 ${
                            plan.highlight ? "text-blue-200" : "text-blue-500"
                          }`}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {razorpayEnabled ? (
                    <RazorpayCheckoutButton
                      planName={plan.name}
                      planLabel={plan.label}
                      highlight={plan.highlight}
                      size="sm"
                      onSuccess={onClose}
                    />
                  ) : (
                    <p className="text-center text-xs text-slate-400 mt-1">
                      Payment gateway not configured
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center text-xs text-slate-400 mt-2">
              Secure payment via Razorpay · Prices in INR · Cancel anytime
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
