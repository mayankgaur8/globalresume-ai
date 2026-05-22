import { describe, it, expect, vi, beforeEach } from "vitest"
import type { PrismaMock } from "../../helpers/prisma-mock"
import { FIXTURES } from "../../fixtures/db"

const prismaMock = vi.hoisted(() => ({} as PrismaMock))
vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("../../helpers/prisma-mock")
  Object.assign(prismaMock, createPrismaMock())
  return { default: prismaMock }
})

// Mock Stripe — constructEvent validates signatures; we bypass that in tests
vi.mock("@/lib/stripe", () => ({
  stripeEnabled: true,
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}))

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "stripe-signature": "test-sig" })),
}))

vi.mock("@/lib/analytics/server", () => ({
  track: vi.fn().mockResolvedValue(undefined),
  identify: vi.fn().mockResolvedValue(undefined),
  flush: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendUpgradeConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendCreditWarningEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentFailedEmail: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from "@/app/api/webhook/stripe/route"
import { stripe } from "@/lib/stripe"

const stripeMock = stripe as unknown as {
  webhooks: { constructEvent: ReturnType<typeof vi.fn> }
  subscriptions: { retrieve: ReturnType<typeof vi.fn> }
}

function makeRequest(body = "{}") {
  return new Request("http://localhost/api/webhook/stripe", {
    method: "POST",
    body,
    headers: { "stripe-signature": "sig_test", "content-type": "application/json" },
  })
}

describe("POST /api/webhook/stripe — secret enforcement", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 503 when STRIPE_WEBHOOK_SECRET is not set", async () => {
    const original = process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.STRIPE_WEBHOOK_SECRET
    const res = await POST(makeRequest())
    expect(res.status).toBe(503)
    process.env.STRIPE_WEBHOOK_SECRET = original
  })

  it("returns 400 when signature header is missing", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    const { headers } = await import("next/headers")
    vi.mocked(headers).mockResolvedValueOnce(new Headers({}))

    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature")
    })
    const req = new Request("http://localhost/api/webhook/stripe", {
      method: "POST",
      body: "{}",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 when Stripe signature is invalid", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Webhook signature verification failed")
    })
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    const text = await res.text()
    expect(text).not.toContain("whsec_test")
  })

  it("does not expose webhook secret in error responses", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_super_secret_value"
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Webhook signature verification failed")
    })
    const res = await POST(makeRequest())
    const body = await res.text()
    expect(body).not.toContain("whsec_super_secret_value")
  })
})

describe("POST /api/webhook/stripe — subscription.deleted", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  })

  it("downgrades subscription to FREE on cancellation", async () => {
    const event = {
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_test123",
          status: "canceled",
          items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 86400, price: { id: "price_pro" } }] },
        },
      },
    }
    stripeMock.webhooks.constructEvent.mockReturnValue(event)
    prismaMock.plan.findUnique.mockResolvedValue(FIXTURES.plans.free)
    prismaMock.subscription.updateMany.mockResolvedValue({ count: 1 })

    const res = await POST(makeRequest(JSON.stringify(event.data.object)))
    expect(res.status).toBe(200)
    expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubId: "sub_test123" },
        data: expect.objectContaining({ status: "canceled" }),
      })
    )
  })
})

describe("POST /api/webhook/stripe — invoice.payment_failed", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  })

  it("marks subscription as past_due on payment failure", async () => {
    const event = {
      type: "invoice.payment_failed",
      data: {
        object: {
          parent: { subscription_details: { subscription: "sub_test123" } },
        },
      },
    }
    stripeMock.webhooks.constructEvent.mockReturnValue(event)
    prismaMock.subscription.updateMany.mockResolvedValue({ count: 1 })

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubId: "sub_test123" },
        data: { status: "past_due" },
      })
    )
  })
})
