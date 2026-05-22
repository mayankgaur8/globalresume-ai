/**
 * Integration tests for server-side template access enforcement.
 * Verifies that the resume create/update APIs correctly gate premium templates.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { PrismaMock } from "../../helpers/prisma-mock"
import { FIXTURES } from "../../fixtures/db"
import { mockSession } from "../../helpers/auth-mock"

const prismaMock = vi.hoisted(() => ({} as PrismaMock))
vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("../../helpers/prisma-mock")
  Object.assign(prismaMock, createPrismaMock())
  return { default: prismaMock }
})

vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn().mockReturnValue({ success: true }) }))

const authMock = vi.hoisted(() => vi.fn())
vi.mock("@/auth", () => ({ auth: authMock }))

import { POST } from "@/app/api/resumes/route"
import { PATCH } from "@/app/api/resumes/[id]/route"

function makeCreateRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/resumes", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })
}

function makePatchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/resumes/resume-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })
}

// ── POST /api/resumes ─────────────────────────────────────────────────────────

describe("POST /api/resumes — template enforcement", () => {
  beforeEach(() => vi.clearAllMocks())

  it("allows creation with free template for FREE user", async () => {
    authMock.mockResolvedValue(mockSession({ id: "free-user-id" }))
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.freeUser)
    prismaMock.resume.count.mockResolvedValue(0)
    prismaMock.template.findUnique.mockResolvedValue(FIXTURES.templates.free)
    prismaMock.purchasedTemplate.findUnique.mockResolvedValue(null)
    prismaMock.resume.create.mockResolvedValue({ ...FIXTURES.resumes.basic, sections: [] })

    const res = await POST(makeCreateRequest({
      title: "My Resume",
      templateId: "tmpl-minimal",
      languageCode: "en",
    }))
    expect(res.status).toBe(201)
  })

  it("blocks premium template for FREE user", async () => {
    authMock.mockResolvedValue(mockSession({ id: "free-user-id" }))
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.freeUser)
    prismaMock.resume.count.mockResolvedValue(0)
    prismaMock.template.findUnique.mockResolvedValue(FIXTURES.templates.premium)
    prismaMock.purchasedTemplate.findUnique.mockResolvedValue(null)

    const res = await POST(makeCreateRequest({
      title: "My Resume",
      templateId: "tmpl-premium",
      languageCode: "en",
    }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.errorCode).toBe("TEMPLATE_ACCESS_DENIED")
    expect(body.success).toBe(false)
    expect(prismaMock.resume.create).not.toHaveBeenCalled()
  })

  it("allows premium template for GLOBAL user", async () => {
    authMock.mockResolvedValue(mockSession({ id: "global-user-id" }))
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.globalUser)
    prismaMock.resume.count.mockResolvedValue(0)
    prismaMock.template.findUnique.mockResolvedValue(FIXTURES.templates.premium)
    prismaMock.resume.create.mockResolvedValue({ ...FIXTURES.resumes.basic, sections: [] })

    const res = await POST(makeCreateRequest({
      title: "My Resume",
      templateId: "tmpl-premium",
      languageCode: "en",
    }))
    expect(res.status).toBe(201)
  })

  it("allows premium template for ADMIN user", async () => {
    authMock.mockResolvedValue(mockSession({ id: "admin-id", role: "ADMIN" }))
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.adminUser)
    prismaMock.resume.count.mockResolvedValue(0)
    prismaMock.template.findUnique.mockResolvedValue(FIXTURES.templates.premium)
    prismaMock.resume.create.mockResolvedValue({ ...FIXTURES.resumes.basic, sections: [] })

    const res = await POST(makeCreateRequest({
      title: "Admin Resume",
      templateId: "tmpl-premium",
      languageCode: "en",
    }))
    expect(res.status).toBe(201)
  })

  it("returns 401 for unauthenticated requests", async () => {
    authMock.mockResolvedValue(null)
    const res = await POST(makeCreateRequest({ title: "Test", templateId: "tmpl-minimal" }))
    expect(res.status).toBe(401)
  })

  it("enforces resume count limit before template check", async () => {
    authMock.mockResolvedValue(mockSession({ id: "free-user-id" }))
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.freeUser)
    prismaMock.resume.count.mockResolvedValue(3) // FREE limit is 3

    const res = await POST(makeCreateRequest({
      title: "My Resume",
      templateId: "tmpl-minimal",
      languageCode: "en",
    }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.errorCode).toBe("RESUME_LIMIT_REACHED")
  })
})

// ── PATCH /api/resumes/[id] ───────────────────────────────────────────────────

describe("PATCH /api/resumes/[id] — template enforcement on update", () => {
  beforeEach(() => vi.clearAllMocks())

  it("blocks switching to premium template for non-GLOBAL user", async () => {
    authMock.mockResolvedValue(mockSession({ id: "free-user-id" }))
    prismaMock.resume.findUnique.mockResolvedValue(FIXTURES.resumes.basic)
    prismaMock.user.findUnique.mockResolvedValue(FIXTURES.users.freeUser)
    prismaMock.template.findUnique.mockResolvedValue(FIXTURES.templates.premium)
    prismaMock.purchasedTemplate.findUnique.mockResolvedValue(null)

    const res = await PATCH(makePatchRequest({ templateId: "tmpl-premium" }), {
      params: Promise.resolve({ id: "resume-1" }),
    })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.errorCode).toBe("TEMPLATE_ACCESS_DENIED")
    expect(prismaMock.resume.update).not.toHaveBeenCalled()
  })

  it("allows ADMIN to switch to any template", async () => {
    authMock.mockResolvedValue(mockSession({ id: "admin-id", role: "ADMIN" }))
    prismaMock.resume.findUnique
      .mockResolvedValueOnce({ ...FIXTURES.resumes.basic, userId: "free-user-id" })
      .mockResolvedValueOnce({ ...FIXTURES.resumes.basic, sections: [] })
    prismaMock.resume.update.mockResolvedValue({})
    prismaMock.resumeSection.findMany.mockResolvedValue([])

    const res = await PATCH(makePatchRequest({ templateId: "tmpl-premium" }), {
      params: Promise.resolve({ id: "resume-1" }),
    })
    expect(prismaMock.template.findUnique).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
  })

  it("returns 403 when user tries to edit another user's resume", async () => {
    authMock.mockResolvedValue(mockSession({ id: "other-user-id" }))
    prismaMock.resume.findUnique.mockResolvedValue({
      ...FIXTURES.resumes.basic,
      userId: "free-user-id",
    })

    const res = await PATCH(makePatchRequest({ title: "Hacked" }), {
      params: Promise.resolve({ id: "resume-1" }),
    })
    expect(res.status).toBe(403)
  })
})
