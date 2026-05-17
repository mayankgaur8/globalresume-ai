import type { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getUserPlanLimits } from "@/lib/access"
import { stripeEnabled } from "@/lib/stripe"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Crown, AlertTriangle } from "lucide-react"
import { CheckoutButton } from "./checkout-button"
import { PortalButton } from "./portal-button"
import Link from "next/link"

export const metadata: Metadata = { title: "Billing & Plan" }

const PLANS = [
  {
    name: "FREE",
    label: "Free",
    price: "$0",
    period: "forever",
    priceId: null as string | null,
    features: [
      "3 Resumes",
      "1 Template (Modern)",
      "English only",
      "PDF with watermark",
      "5 AI credits / month",
    ],
    highlight: false,
  },
  {
    name: "BASIC",
    label: "Basic",
    price: "$9",
    period: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC ?? null,
    features: [
      "10 Resumes",
      "3 Templates",
      "1 Language",
      "Clean PDF export",
      "50 AI credits / month",
    ],
    highlight: false,
  },
  {
    name: "PRO",
    label: "Pro",
    price: "$15",
    period: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? null,
    features: [
      "Unlimited resumes",
      "8 Premium templates",
      "3 Languages",
      "DOCX export",
      "Unlimited AI credits",
      "ATS score checker",
    ],
    highlight: true,
  },
  {
    name: "GLOBAL",
    label: "Global",
    price: "$29",
    period: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GLOBAL ?? null,
    features: [
      "Everything in Pro",
      "All 12 templates",
      "All 7+ languages",
      "AI translation",
      "Priority support",
      "Cover letter AI",
    ],
    highlight: false,
  },
]

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; canceled_plan?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [subscription, limits] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    }),
    getUserPlanLimits(session.user.id),
  ])

  const sp = await searchParams
  const currentPlan = limits.plan
  const hasActivePaidPlan = currentPlan !== "FREE" && currentPlan !== "ADMIN"
  const isExpired = subscription?.status === "canceled" || subscription?.status === "past_due"

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Billing &amp; Plan</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your subscription and upgrade your plan.</p>
      </div>

      {/* Status banners */}
      {sp.success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">
            Payment successful! Your plan has been upgraded. It may take a moment to reflect.
          </p>
        </div>
      )}
      {(sp.canceled || sp.canceled_plan) && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm font-medium text-amber-800">
            {sp.canceled_plan
              ? "Your subscription has been canceled. You'll retain access until the period ends."
              : "Checkout was canceled. No charge was made."}
          </p>
        </div>
      )}
      {!stripeEnabled && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-slate-500 shrink-0" />
          <p className="text-sm text-slate-600">
            <strong>Demo mode:</strong> Stripe is not configured. Add{" "}
            <code className="bg-slate-100 px-1 rounded text-xs">STRIPE_SECRET_KEY</code> to enable
            real payments.
          </p>
        </div>
      )}

      {/* Current plan card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
            <Crown className="h-5 w-5 text-amber-500" />
            Current Plan:{" "}
            <span className="font-bold">
              {currentPlan === "ADMIN" ? "Admin (Full Access)" : currentPlan}
            </span>
            {isExpired && (
              <span className="text-xs font-normal text-red-600 bg-red-100 px-2 py-0.5 rounded-full ml-2">
                {subscription?.status === "past_due" ? "Past due" : "Canceled"}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-blue-800">
            <span>Resumes: {limits.maxResumes >= 999 ? "Unlimited" : limits.maxResumes}</span>
            <span>·</span>
            <span>Templates: {limits.maxTemplates >= 999 ? "All" : limits.maxTemplates}</span>
            <span>·</span>
            <span>Languages: {limits.maxLanguages >= 999 ? "All" : limits.maxLanguages}</span>
            <span>·</span>
            <span>AI: {limits.aiCreditsPerMonth >= 999 ? "Unlimited" : `${limits.aiCreditsPerMonth}/mo`}</span>
            <span>·</span>
            <span>PDF: {limits.hasWatermark ? "With watermark" : "Clean"}</span>
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="text-xs text-blue-600 mt-2">
              {subscription.status === "canceled" ? "Access ends" : "Renews"} on{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          {hasActivePaidPlan && stripeEnabled && (
            <div className="mt-3 flex gap-2">
              <PortalButton />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan grid */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-4">Choose a plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrentPlan = currentPlan === plan.name
            return (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col relative ${
                  plan.highlight
                    ? "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-200 lg:-translate-y-2"
                    : "bg-white border-slate-200"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <p className={`font-bold text-lg ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.label}
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlight ? "text-blue-200" : "text-slate-400"}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-sm ${
                        plan.highlight ? "text-blue-100" : "text-slate-600"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          plan.highlight ? "text-blue-200" : "text-blue-500"
                        }`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button
                    disabled
                    className={`w-full cursor-default ${
                      plan.highlight
                        ? "bg-white/20 text-white border-white/30 hover:bg-white/20"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    Current Plan
                  </Button>
                ) : plan.priceId && stripeEnabled ? (
                  <CheckoutButton priceId={plan.priceId} planName={plan.label} highlight={plan.highlight} />
                ) : plan.name !== "FREE" ? (
                  <Button
                    disabled
                    variant="outline"
                    className={`w-full ${plan.highlight ? "border-white/30 text-white" : ""}`}
                  >
                    Configure Stripe to upgrade
                  </Button>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        Payments are processed securely by Stripe. Cancel anytime.{" "}
        <Link href="/#pricing" className="underline hover:text-slate-600">
          See full feature comparison
        </Link>
      </p>
    </div>
  )
}
