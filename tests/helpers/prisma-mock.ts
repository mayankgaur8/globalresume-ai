/**
 * Typed Prisma mock factory.
 * Usage: vi.mock("@/lib/prisma", () => ({ default: createPrismaMock() }))
 */
import { vi } from "vitest"

export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T

export function createPrismaMock() {
  return {
    $transaction: vi.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    resume: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    resumeSection: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    template: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    language: {
      findUnique: vi.fn(),
    },
    plan: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    razorpayOrder: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    aIUsageLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    purchasedTemplate: {
      findUnique: vi.fn(),
    },
    purchasedLanguage: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  }
}

export type PrismaMock = ReturnType<typeof createPrismaMock>
