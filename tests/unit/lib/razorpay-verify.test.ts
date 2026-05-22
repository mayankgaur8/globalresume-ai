import { describe, it, expect } from "vitest"
import crypto from "crypto"
import Razorpay from "razorpay"
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils"

function hmacHex(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex")
}

const SECRET = "test_webhook_secret_abc123"
const KEY_SECRET = "test_key_secret_xyz789"
const ORDER_ID = "order_testABC"
const PAYMENT_ID = "pay_testXYZ"

describe("Razorpay.validateWebhookSignature", () => {
  it("returns true for a valid webhook signature", () => {
    const body = JSON.stringify({ event: "payment.captured" })
    const signature = hmacHex(body, SECRET)

    expect(Razorpay.validateWebhookSignature(body, signature, SECRET)).toBe(true)
  })

  it("returns false when signature does not match body", () => {
    const body = JSON.stringify({ event: "payment.captured" })
    const signature = hmacHex("tampered_body", SECRET)

    expect(Razorpay.validateWebhookSignature(body, signature, SECRET)).toBe(false)
  })

  it("returns false when signature is signed with wrong secret", () => {
    const body = JSON.stringify({ event: "payment.captured" })
    const signature = hmacHex(body, "wrong_secret")

    expect(Razorpay.validateWebhookSignature(body, signature, SECRET)).toBe(false)
  })

  it("returns false for an empty signature", () => {
    const body = JSON.stringify({ event: "payment.captured" })
    expect(Razorpay.validateWebhookSignature(body, "", SECRET)).toBe(false)
  })
})

describe("Razorpay.validatePaymentVerification", () => {
  it("returns true for a valid payment signature", () => {
    const expected = hmacHex(`${ORDER_ID}|${PAYMENT_ID}`, KEY_SECRET)

    expect(
      validatePaymentVerification(
        { order_id: ORDER_ID, payment_id: PAYMENT_ID },
        expected,
        KEY_SECRET
      )
    ).toBe(true)
  })

  it("returns false when payment_id is tampered", () => {
    const expected = hmacHex(`${ORDER_ID}|${PAYMENT_ID}`, KEY_SECRET)

    expect(
      validatePaymentVerification(
        { order_id: ORDER_ID, payment_id: "pay_tampered" },
        expected,
        KEY_SECRET
      )
    ).toBe(false)
  })

  it("returns false when order_id is tampered", () => {
    const expected = hmacHex(`${ORDER_ID}|${PAYMENT_ID}`, KEY_SECRET)

    expect(
      validatePaymentVerification(
        { order_id: "order_tampered", payment_id: PAYMENT_ID },
        expected,
        KEY_SECRET
      )
    ).toBe(false)
  })

  it("returns false when signed with wrong key secret", () => {
    const expected = hmacHex(`${ORDER_ID}|${PAYMENT_ID}`, "wrong_secret")

    expect(
      validatePaymentVerification(
        { order_id: ORDER_ID, payment_id: PAYMENT_ID },
        expected,
        KEY_SECRET
      )
    ).toBe(false)
  })
})
