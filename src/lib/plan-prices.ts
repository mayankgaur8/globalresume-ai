export type PaidPlanName = "BASIC" | "PRO" | "GLOBAL"

export interface PlanPrice {
  amount: number   // smallest currency unit (cents for USD)
  currency: string
  label: string
}

export const PLAN_PRICES: Record<PaidPlanName, PlanPrice> = {
  BASIC:  { amount: 900,  currency: "USD", label: "Basic"  },
  PRO:    { amount: 1500, currency: "USD", label: "Pro"    },
  GLOBAL: { amount: 2900, currency: "USD", label: "Global" },
}

export function isPaidPlan(name: string): name is PaidPlanName {
  return name === "BASIC" || name === "PRO" || name === "GLOBAL"
}
