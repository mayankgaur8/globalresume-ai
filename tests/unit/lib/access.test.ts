import { describe, it, expect, vi, beforeEach } from "vitest"
import type { PrismaMock } from "../../helpers/prisma-mock"
import { FIXTURES } from "../../fixtures/db"

// vi.hoisted creates the object before imports; factory populates it in-place
const prismaMock = vi.hoisted(() => ({} as PrismaMock))
vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("../../helpers/prisma-mock")
  Object.assign(prismaMock, createPrismaMock())
  return { default: prismaMock }
})

import {
  getUserPlanLimits,
  canAccessTemplate,
  canUseAI,
} from "@/lib/access"

describe("getUserPlanLimits", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns FREE limits when user not found", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const limits = await getUserPlanLimits("nonexistent")
    expect(limits.plan).toBe("FREE")
    expect(limits.maxResumes).toBe(3)
    expect(limits.hasWatermark).toBe(true)
  })

  it("returns ADMIN limits for ADMIN role", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.adminUser)
    const limits = await getUserPlanLimits("admin-id")
    expect(limits.plan).toBe("ADMIN")
    expect(limits.canAccessAllTemplates).toBe(true)
    expect(limits.maxResumes).toBe(999)
  })

  it("returns PRO limits for PRO subscriber", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.proUser)
    const limits = await getUserPlanLimits("pro-user-id")
    expect(limits.plan).toBe("PRO")
    expect(limits.maxResumes).toBe(999)
    expect(limits.hasWatermark).toBe(false)
    expect(limits.canExportDocx).toBe(true)
    expect(limits.aiCreditsPerMonth).toBe(999)
  })

  it("returns GLOBAL limits for GLOBAL subscriber", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.globalUser)
    const limits = await getUserPlanLimits("global-user-id")
    expect(limits.plan).toBe("GLOBAL")
    expect(limits.canAccessAllTemplates).toBe(true)
  })

  it("returns FREE when subscription plan is missing", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...FIXTURES.users.freeUser,
      subscription: null,
    })
    const limits = await getUserPlanLimits("free-user-id")
    expect(limits.plan).toBe("FREE")
  })
})

describe("canAccessTemplate", () => {
  beforeEach(() => vi.clearAllMocks())

  it("allows free template for any user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.freeUser)
    prismaMock.template.findUnique.mockResolvedValue(FIXTURES.templates.free)
    const ok = await canAccessTemplate("free-user-id", "tmpl-minimal")
    expect(ok).toBe(true)
  })

  it("blocks premium template for FREE user with no purchase", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.freeUser)
    prismaMock.template.findUnique.mockResolvedValue(FIXTURES.templates.premium)
    prismaMock.purchasedTemplate.findUnique.mockResolvedValue(null)
    const ok = await canAccessTemplate("free-user-id", "tmpl-premium")
    expect(ok).toBe(false)
  })

  it("allows premium template for GLOBAL user without purchase check", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.globalUser)
    prismaMock.template.findUnique.mockResolvedValue(FIXTURES.templates.premium)
    const ok = await canAccessTemplate("global-user-id", "tmpl-premium")
    expect(ok).toBe(true)
    expect(prismaMock.purchasedTemplate.findUnique).not.toHaveBeenCalled()
  })

  it("allows premium template for ADMIN user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.adminUser)
    prismaMock.template.findUnique.mockResolvedValue(FIXTURES.templates.premium)
    const ok = await canAccessTemplate("admin-id", "tmpl-premium")
    expect(ok).toBe(true)
  })

  it("allows premium template for user who individually purchased it", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.freeUser)
    prismaMock.template.findUnique.mockResolvedValue(FIXTURES.templates.premium)
    prismaMock.purchasedTemplate.findUnique.mockResolvedValue({
      id: "purchase-1",
      userId: "free-user-id",
      templateId: "tmpl-premium",
    })
    const ok = await canAccessTemplate("free-user-id", "tmpl-premium")
    expect(ok).toBe(true)
  })

  it("returns false when template does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.freeUser)
    prismaMock.template.findUnique.mockResolvedValue(null)
    const ok = await canAccessTemplate("free-user-id", "nonexistent-template")
    expect(ok).toBe(false)
  })
})

describe("canUseAI", () => {
  beforeEach(() => vi.clearAllMocks())

  it("allows AI when under credit limit", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.freeUser)
    prismaMock.aIUsageLog.count.mockResolvedValue(3)
    const result = await canUseAI("free-user-id")
    expect(result.allowed).toBe(true)
  })

  it("blocks AI when credit limit reached", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.freeUser)
    prismaMock.aIUsageLog.count.mockResolvedValue(5)
    const result = await canUseAI("free-user-id")
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("5 AI credits")
  })

  it("allows AI for PRO user well under limit", async () => {
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.proUser)
    prismaMock.aIUsageLog.count.mockResolvedValue(500)
    const result = await canUseAI("pro-user-id")
    expect(result.allowed).toBe(true)
  })
})
