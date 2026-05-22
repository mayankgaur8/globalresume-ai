// Global test setup — runs before every test file
import { vi } from "vitest"

// Silence console noise from modules under test
vi.spyOn(console, "error").mockImplementation(() => {})
vi.spyOn(console, "warn").mockImplementation(() => {})

// Stub process.env so individual tests can override safely
// NODE_ENV is read-only; it is already "test" when vitest runs
process.env.AUTH_SECRET = "test-secret-minimum-32-chars-xxxxxxxx"
process.env.NEXTAUTH_URL = "http://localhost:3000"
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"
