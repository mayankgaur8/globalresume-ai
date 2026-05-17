import Stripe from "stripe"

const key = process.env.STRIPE_SECRET_KEY ?? ""

// Only initialise if a real key is present
export const stripe = key
  ? new Stripe(key, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiVersion: "2025-04-30.basil" as any,
      typescript: true,
    })
  : null

export const stripeEnabled = !!stripe && key !== "sk_test_dummy" && key !== ""

export const STRIPE_PRICES = {
  BASIC: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC ?? "",
  PRO: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "",
  GLOBAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_GLOBAL ?? "",
}
