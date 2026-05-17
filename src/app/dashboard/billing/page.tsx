import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getUserPlanLimits } from "@/lib/access"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Crown, Zap } from "lucide-react"
import { CheckoutButton } from "./checkout-button"

const PLANS = [
  {
    name: "FREE",
    label: "Free",
    price: "$0",
    period: "forever",
    priceId: null,
    features: ["1 Basic Template", "English Only", "PDF with Watermark", "Basic Resume Builder"],
    highlight: false,
  },
  {
    name: "BASIC",
    label: "Basic",
    price: "$9",
    period: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || "price_basic_dummy",
    features: ["3 Templates", "1 Language", "Clean PDF Export", "AI Summary Generator"],
    highlight: false,
  },
  {
    name: "PRO",
    label: "Pro",
    price: "$15",
    period: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || "price_pro_dummy",
    features: ["8 Premium Templates", "3 Languages", "Unlimited PDF Exports", "AI Resume Assistant", "ATS Checker"],
    highlight: true,
  },
  {
    name: "GLOBAL",
    label: "Global",
    price: "$29",
    period: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GLOBAL || "price_global_dummy",
    features: ["All Templates", "All 7 Languages", "Advanced AI Translation", "Priority Support", "ATS Score Checker"],
    highlight: false,
  },
]

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [subscription, limits] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    }),
    getUserPlanLimits(session.user.id),
  ])

  const currentPlan = limits.plan

  const searchParams = new URLSearchParams()
  const success = searchParams.get("success")
  const canceled = searchParams.get("canceled")

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Billing & Plan</h1>
        <p className="text-slate-500 mt-1">Manage your subscription and upgrade your plan.</p>
      </div>

      {/* Current Plan Summary */}
      <Card className="mb-8 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Crown className="h-5 w-5 text-amber-500" />
            Current Plan: {currentPlan === "ADMIN" ? "Admin (Full Access)" : currentPlan}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-blue-800">
            <span>Templates: {limits.maxTemplates >= 999 ? "All" : limits.maxTemplates}</span>
            <span>·</span>
            <span>Languages: {limits.maxLanguages >= 999 ? "All" : limits.maxLanguages}</span>
            <span>·</span>
            <span>PDF: {limits.hasWatermark ? "With watermark" : "Clean"}</span>
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="text-xs text-blue-600 mt-2">
              Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.name
          return (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-200 md:-translate-y-2"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="mb-4">
                <p className={`font-semibold text-lg ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-3xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-blue-200" : "text-slate-500"}`}>{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlight ? "text-blue-100" : "text-slate-600"}`}>
                    <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlight ? "text-blue-200" : "text-blue-500"}`} />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <Button disabled variant="outline" className={`w-full ${plan.highlight ? "bg-white/20 text-white border-white/30" : ""}`}>
                  Current Plan
                </Button>
              ) : plan.priceId ? (
                <CheckoutButton priceId={plan.priceId} planName={plan.label} highlight={plan.highlight} />
              ) : (
                <Button disabled variant="outline" className="w-full">
                  Free Plan
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        Payments are processed securely by Stripe. Cancel anytime. All prices in USD.
      </p>
    </div>
  )
}
