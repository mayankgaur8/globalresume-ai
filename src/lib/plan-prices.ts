export type PaidPlanName = "BASIC" | "PRO" | "GLOBAL"

export interface PlanPrice {
  amount: number   // smallest currency unit — paise for INR (1 INR = 100 paise)
  currency: string
  label: string
  display: string  // human-readable price label, e.g. "₹799"
}

export const PLAN_PRICES: Record<PaidPlanName, PlanPrice> = {
  BASIC:  { amount: 79900,  currency: "INR", label: "Basic",  display: "₹799"   },
  PRO:    { amount: 129900, currency: "INR", label: "Pro",    display: "₹1,299" },
  GLOBAL: { amount: 249900, currency: "INR", label: "Global", display: "₹2,499" },
}

export function isPaidPlan(name: string): name is PaidPlanName {
  return name === "BASIC" || name === "PRO" || name === "GLOBAL"
}
