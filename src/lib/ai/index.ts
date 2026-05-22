/**
 * AI provider factory.
 * Returns OpenAIProvider when key is configured; MockProvider otherwise.
 * Tests override this via vi.mock("@/lib/ai").
 */
import type { AIProvider } from "./providers/base"
import { OpenAIProvider } from "./providers/openai"
import { MockAIProvider } from "./providers/mock"

export type { AIProvider, ChatMessage, CompletionResult, TokenUsage } from "./providers/base"
export { sanitize, sanitizeMany, INPUT_LIMITS } from "./middleware/sanitize"
export { parseATSOutput, validateTextOutput, validateBulletOutput } from "./validators/outputs"

let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (_provider) return _provider

  const key = process.env.OPENAI_API_KEY ?? ""
  const isReal = key !== "" && key !== "sk-dummy" && key.startsWith("sk-")

  _provider = isReal
    ? new OpenAIProvider(key, "gpt-4o-mini")
    : new MockAIProvider()

  return _provider
}

/** Override the provider — useful in tests and local dev with custom mocks. */
export function setAIProvider(provider: AIProvider) {
  _provider = provider
}

/** Reset to auto-detect — call in afterEach in tests. */
export function resetAIProvider() {
  _provider = null
}
