import { describe, it, expect, vi, beforeEach } from "vitest"
import crypto from "crypto"
import type { PrismaMock } from "../../helpers/prisma-mock"
import { FIXTURES } from "../../fixtures/db"
import { mockSession } from "../../helpers/auth-mock"

// ── Mock wiring ───────────────────────────────────────────────────────────────

const prismaMock = vi.hoisted(() => ({} as PrismaMock))
vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("../../helpers/prisma-mock")
  Object.assign(prismaMock, createPrismaMock())
  return { default: prismaMock }
})

vi.mock("@/lib/razorpay", () => ({
  razorpay: { orders: { create: vi.fn() } },
  razorpayEnabled: true,
}))

const authMock = vi.hoisted(() => vi.fn())
vi.mock("@/auth", () => ({ auth: authMock }))

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "x-razorpay-signature": "test-sig" })),
}))

vi.mock("@/lib/analytics/server", () => ({
  track: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/email", () => ({
  sendUpgradeConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentFailedEmail: vi.fn().mockResolvedValue(undefined),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = "whsec_test_razorpay"

function signBody(body: string, secret = WEBHOOK_SECRET): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex")
}

function makeWebhookRequest(body: string, signature?: string): Request {
  const sig = signature ?? signBody(body)
  return new Request("http://localhost/api/payments/razorpay/webhook", {
    method: "POST",
    body,
    headers: { "x-razorpay-signature": sig, "content-type": "application/json" },
  })
}

function makeApiRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })
}

// ── Webhook: secret enforcement ───────────────────────────────────────────────

describe("POST /api/payments/razorpay/webhook — secret enforcement", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 503 when RAZORPAY_WEBHOOK_SECRET is not set", async () => {
    const original = process.env.RAZORPAY_WEBHOOK_SECRET
    delete process.env.RAZORPAY_WEBHOOK_SECRET

    const { POST } = await import("@/app/api/payments/razorpay/webhook/route")
    const res = await POST(makeWebhookRequest("{}"))
    expect(res.status).toBe(503)

    process.env.RAZORPAY_WEBHOOK_SECRET = original
  })

  it("returns 400 when x-razorpay-signature header is missing", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET
    const { headers } = await import("next/headers")
    vi.mocked(headers).mockResolvedValueOnce(new Headers({}))

    const { POST } = await import("@/app/api/payments/razorpay/webhook/route")
    const res = await POST(makeWebhookRequest("{}"))
    expect(res.status).toBe(400)
  })

  it("returns 400 when signature is invalid", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET

    const { POST } = await import("@/app/api/payments/razorpay/webhook/route")
    const body = JSON.stringify({ event: "payment.captured", payload: {} })
    const res = await POST(makeWebhookRequest(body, "bad_signature_that_wont_match"))
    expect(res.status).toBe(400)
  })

  it("does not expose webhook secret in error response body", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "super_secret_value_xyz"

    const { POST } = await import("@/app/api/payments/razorpay/webhook/route")
    const body = JSON.stringify({ event: "payment.captured" })
    const res = await POST(makeWebhookRequest(body, "bad_sig"))
    const text = await res.text()
    expect(text).not.toContain("super_secret_value_xyz")

    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET
  })

  it("returns 200 for unknown event types (no-op)", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET

    const body = JSON.stringify({ event: "unknown.event", payload: {} })
    const validSig = signBody(body)

    // Inject the real HMAC so the route's signature check passes
    const { headers } = await import("next/headers")
    vi.mocked(headers).mockResolvedValueOnce(new Headers({ "x-razorpay-signature": validSig }))

    const { POST } = await import("@/app/api/payments/razorpay/webhook/route")
    const res = await POST(makeWebhookRequest(body, validSig))
    expect(res.status).toBe(200)
  })
})

// ── create-order: auth & plan validation ─────────────────────────────────────

describe("POST /api/payments/razorpay/create-order", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 for unauthenticated users", async () => {
    authMock.mockResolvedValueOnce(null)

    const { POST } = await import("@/app/api/payments/razorpay/create-order/route")
    const res = await POST(makeApiRequest("/api/payments/razorpay/create-order", { planName: "PRO" }))
    expect(res.status).toBe(401)
  })

  it("returns 400 for an invalid plan name", async () => {
    authMock.mockResolvedValueOnce(mockSession({ id: FIXTURES.users.freeUser.id }))

    const { POST } = await import("@/app/api/payments/razorpay/create-order/route")
    const res = await POST(makeApiRequest("/api/payments/razorpay/create-order", { planName: "ENTERPRISE" }))
    expect(res.status).toBe(400)
    const data = (await res.json()) as { error: string }
    expect(data.error).toMatch(/invalid plan/i)
  })

  it("returns 400 for FREE plan (not purchasable)", async () => {
    authMock.mockResolvedValueOnce(mockSession({ id: FIXTURES.users.freeUser.id }))

    const { POST } = await import("@/app/api/payments/razorpay/create-order/route")
    const res = await POST(makeApiRequest("/api/payments/razorpay/create-order", { planName: "FREE" }))
    expect(res.status).toBe(400)
  })

  it("creates a Razorpay order for a valid authenticated request", async () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_key"
    authMock.mockResolvedValueOnce(mockSession({ id: FIXTURES.users.freeUser.id }))
    prismaMock.plan.findUnique.mockResolvedValue(FIXTURES.plans.pro)
    prismaMock.razorpayOrder.create.mockResolvedValue({})

    const { razorpay } = await import("@/lib/razorpay")
    const rzpMock = razorpay as NonNullable<typeof razorpay>
    vi.mocked(rzpMock.orders.create).mockResolvedValueOnce(
      { id: "order_new123", amount: 129900, currency: "INR" } as unknown as Awaited<
        ReturnType<typeof rzpMock.orders.create>
      >
    )

    const { POST } = await import("@/app/api/payments/razorpay/create-order/route")
    const res = await POST(makeApiRequest("/api/payments/razorpay/create-order", { planName: "PRO" }))
    expect(res.status).toBe(200)
    const data = (await res.json()) as { orderId: string; amount: number; currency: string }
    expect(data.orderId).toBe("order_new123")
    expect(data.amount).toBe(129900)
    expect(data.currency).toBe("INR")
  })
})

// ── verify: entitlement gate ──────────────────────────────────────────────────

describe("POST /api/payments/razorpay/verify — entitlement enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RAZORPAY_KEY_SECRET = "rzp_key_secret_test"
  })

  it("rejects payment with invalid signature — subscription NOT updated", async () => {
    authMock.mockResolvedValueOnce(mockSession({ id: FIXTURES.users.freeUser.id }))

    const { POST } = await import("@/app/api/payments/razorpay/verify/route")
    const res = await POST(
      makeApiRequest("/api/payments/razorpay/verify", {
        razorpay_order_id: "order_test",
        razorpay_payment_id: "pay_test",
        razorpay_signature: "completely_wrong_signature",
      })
    )
    expect(res.status).toBe(400)
    expect(prismaMock.subscription.upsert).not.toHaveBeenCalled()
  })
})
