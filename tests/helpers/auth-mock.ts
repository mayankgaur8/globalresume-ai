import { vi } from "vitest"

export function mockSession(overrides?: {
  id?: string
  email?: string
  name?: string
  role?: "USER" | "ADMIN"
}) {
  return {
    user: {
      id: overrides?.id ?? "test-user-id",
      email: overrides?.email ?? "test@example.com",
      name: overrides?.name ?? "Test User",
      role: overrides?.role ?? "USER",
    },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  }
}

export function mockAuthModule(session = mockSession()) {
  return vi.fn().mockResolvedValue(session)
}

export const ADMIN_SESSION = mockSession({ id: "admin-id", role: "ADMIN" })
export const FREE_SESSION = mockSession({ id: "free-user-id", role: "USER" })
export const PRO_SESSION = mockSession({ id: "pro-user-id", role: "USER" })
