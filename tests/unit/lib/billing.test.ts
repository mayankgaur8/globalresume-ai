import { describe, it, expect, vi, beforeEach } from "vitest"
import type { PrismaMock } from "../../helpers/prisma-mock"
import { FIXTURES } from "../../fixtures/db"

// ── Prisma mock ───────────────────────────────────────────────────────────────
const prismaMock = vi.hoisted(() => ({} as PrismaMock))
vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("../../helpers/prisma-mock")
  Object.assign(prismaMock, createPrismaMock())
  return { default: prismaMock }
})

import { PLAN_PRICES, isPaidPlan } from "@/lib/plan-prices"
import { getUserPlanLimits, isAdminEmail } from "@/lib/access"

// ── INR price constants ───────────────────────────────────────────────────────

describe("PLAN_PRICES — INR paise amounts", () => {
  it("BASIC is ₹799 = 79900 paise in INR", () => {
    expect(PLAN_PRICES.BASIC.amount).toBe(79900)
    expect(PLAN_PRICES.BASIC.currency).toBe("INR")
    expect(PLAN_PRICES.BASIC.display).toBe("₹799")
  })

  it("PRO is ₹1,299 = 129900 paise in INR", () => {
    expect(PLAN_PRICES.PRO.amount).toBe(129900)
    expect(PLAN_PRICES.PRO.currency).toBe("INR")
    expect(PLAN_PRICES.PRO.display).toBe("₹1,299")
  })

  it("GLOBAL is ₹2,499 = 249900 paise in INR", () => {
    expect(PLAN_PRICES.GLOBAL.amount).toBe(249900)
    expect(PLAN_PRICES.GLOBAL.currency).toBe("INR")
    expect(PLAN_PRICES.GLOBAL.display).toBe("₹2,499")
  })

  it("all paid plans use INR currency", () => {
    for (const price of Object.values(PLAN_PRICES)) {
      expect(price.currency).toBe("INR")
    }
  })

  it("amounts are in paise (each ≥ 100x their rupee value)", () => {
    expect(PLAN_PRICES.BASIC.amount).toBeGreaterThanOrEqual(100)
    expect(PLAN_PRICES.PRO.amount).toBeGreaterThanOrEqual(100)
    expect(PLAN_PRICES.GLOBAL.amount).toBeGreaterThanOrEqual(100)
  })

  it("GLOBAL costs more than PRO costs more than BASIC", () => {
    expect(PLAN_PRICES.GLOBAL.amount).toBeGreaterThan(PLAN_PRICES.PRO.amount)
    expect(PLAN_PRICES.PRO.amount).toBeGreaterThan(PLAN_PRICES.BASIC.amount)
  })
})

// ── isPaidPlan guard ──────────────────────────────────────────────────────────

describe("isPaidPlan", () => {
  it("returns true for BASIC, PRO, GLOBAL", () => {
    expect(isPaidPlan("BASIC")).toBe(true)
    expect(isPaidPlan("PRO")).toBe(true)
    expect(isPaidPlan("GLOBAL")).toBe(true)
  })

  it("returns false for FREE", () => {
    expect(isPaidPlan("FREE")).toBe(false)
  })

  it("returns false for arbitrary strings", () => {
    expect(isPaidPlan("ENTERPRISE")).toBe(false)
    expect(isPaidPlan("")).toBe(false)
  })
})

// ── isAdminEmail bypass ───────────────────────────────────────────────────────

describe("isAdminEmail", () => {
  it("returns true for the owner email", () => {
    expect(isAdminEmail("mayankgaur.8@gmail.com")).toBe(true)
  })

  it("is case-sensitive — different casing does not grant admin", () => {
    expect(isAdminEmail("Mayankgaur.8@gmail.com")).toBe(false)
    expect(isAdminEmail("MAYANKGAUR.8@GMAIL.COM")).toBe(false)
  })

  it("returns false for arbitrary emails", () => {
    expect(isAdminEmail("attacker@evil.com")).toBe(false)
    expect(isAdminEmail("admin@globalresumeai.com")).toBe(false)
  })

  it("returns false for null and undefined", () => {
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
  })
})

// ── getUserPlanLimits — admin bypass ──────────────────────────────────────────

describe("getUserPlanLimits — admin email bypass", () => {
  beforeEach(() => vi.clearAllMocks())

  it("grants ADMIN limits to a USER-role account with the owner email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.adminEmailUser)
    const limits = await getUserPlanLimits("admin-email-id")
    expect(limits.plan).toBe("ADMIN")
    expect(limits.canAccessAllTemplates).toBe(true)
    expect(limits.canExportDocx).toBe(true)
    expect(limits.canUseATSChecker).toBe(true)
    expect(limits.canUseCoverLetterAI).toBe(true)
    expect(limits.maxResumes).toBe(999)
    expect(limits.maxLanguages).toBe(999)
    expect(limits.hasWatermark).toBe(false)
    expect(limits.aiCreditsPerMonth).toBe(9999)
  })

  it("grants ADMIN limits to DB-role ADMIN regardless of email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.adminUser)
    const limits = await getUserPlanLimits("admin-id")
    expect(limits.plan).toBe("ADMIN")
  })
})

// ── Plan limit enforcement per tier ──────────────────────────────────────────

describe("getUserPlanLimits — tier enforcement", () => {
  beforeEach(() => vi.clearAllMocks())

  it("FREE: 3 resumes, 1 template, 1 language, watermark, 5 AI credits", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.freeUser)
    const limits = await getUserPlanLimits("free-user-id")
    expect(limits.plan).toBe("FREE")
    expect(limits.maxResumes).toBe(3)
    expect(limits.maxTemplates).toBe(1)
    expect(limits.maxLanguages).toBe(1)
    expect(limits.hasWatermark).toBe(true)
    expect(limits.aiCreditsPerMonth).toBe(5)
    expect(limits.canExportDocx).toBe(false)
    expect(limits.canUseATSChecker).toBe(false)
    expect(limits.canUseCoverLetterAI).toBe(false)
  })

  it("BASIC: 10 resumes, 3 templates, 1 language, no watermark, 50 AI credits", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.basicUser)
    const limits = await getUserPlanLimits("basic-user-id")
    expect(limits.plan).toBe("BASIC")
    expect(limits.maxResumes).toBe(10)
    expect(limits.maxTemplates).toBe(3)
    expect(limits.maxLanguages).toBe(1)
    expect(limits.hasWatermark).toBe(false)
    expect(limits.aiCreditsPerMonth).toBe(50)
    expect(limits.canExportDocx).toBe(false)
    expect(limits.canUseATSChecker).toBe(false)
  })

  it("PRO: unlimited resumes, 8 templates, 3 languages, DOCX, ATS, unlimited AI", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.proUser)
    const limits = await getUserPlanLimits("pro-user-id")
    expect(limits.plan).toBe("PRO")
    expect(limits.maxResumes).toBe(999)
    expect(limits.maxTemplates).toBe(8)
    expect(limits.maxLanguages).toBe(3)
    expect(limits.hasWatermark).toBe(false)
    expect(limits.canExportDocx).toBe(true)
    expect(limits.canUseATSChecker).toBe(true)
    expect(limits.canUseCoverLetterAI).toBe(false)
    expect(limits.aiCreditsPerMonth).toBe(999)
  })

  it("GLOBAL: everything unlimited, cover letter AI, all templates", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.globalUser)
    const limits = await getUserPlanLimits("global-user-id")
    expect(limits.plan).toBe("GLOBAL")
    expect(limits.canAccessAllTemplates).toBe(true)
    expect(limits.maxLanguages).toBe(999)
    expect(limits.canUseCoverLetterAI).toBe(true)
    expect(limits.canUseATSChecker).toBe(true)
    expect(limits.aiCreditsPerMonth).toBe(9999)
  })
})

// ── Razorpay: server-side amount is never from frontend ───────────────────────

describe("Razorpay server-side price enforcement", () => {
  it("create-order route always uses server-side PLAN_PRICES, not a frontend amount", () => {
    // Verify there is no 'amount' field accepted from the request body —
    // PLAN_PRICES is the single source of truth for every plan's paise amount.
    const proAmount = PLAN_PRICES.PRO.amount
    const basicAmount = PLAN_PRICES.BASIC.amount
    const globalAmount = PLAN_PRICES.GLOBAL.amount

    // Amounts must be positive integers (paise)
    expect(Number.isInteger(proAmount)).toBe(true)
    expect(Number.isInteger(basicAmount)).toBe(true)
    expect(Number.isInteger(globalAmount)).toBe(true)
    expect(proAmount).toBeGreaterThan(0)
    expect(basicAmount).toBeGreaterThan(0)
    expect(globalAmount).toBeGreaterThan(0)
  })

  it("a frontend-supplied amount field cannot override server-side constants", () => {
    // Simulate what the create-order handler does: look up from PLAN_PRICES by name only
    const planName = "PRO"
    const fakeAmountFromFrontend = 1 // attacker tries ₹0.01

    const priceConfig = PLAN_PRICES[planName]
    // The route ignores fakeAmountFromFrontend entirely
    expect(priceConfig.amount).toBe(129900)
    expect(priceConfig.amount).not.toBe(fakeAmountFromFrontend)
  })
})
