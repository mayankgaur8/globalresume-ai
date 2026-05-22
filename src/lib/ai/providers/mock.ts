/**
 * Deterministic mock AI provider for tests and dev environments without an API key.
 * Never makes network calls. Responses are predictable, allowing snapshot testing.
 */
import type { AIProvider, ChatMessage, CompletionOptions, CompletionResult } from "./base"

export class MockAIProvider implements AIProvider {
  readonly name = "mock"
  readonly model = "mock-1.0"

  private readonly responses: Map<string, string>

  constructor(overrides: Record<string, string> = {}) {
    this.responses = new Map(Object.entries(overrides))
  }

  async complete(messages: ChatMessage[], opts: CompletionOptions = {}): Promise<CompletionResult> {
    const lastUser = messages.findLast((m) => m.role === "user")?.content ?? ""

    // Find a registered override or generate a deterministic fallback
    let content = ""
    for (const [key, value] of this.responses) {
      if (lastUser.toLowerCase().includes(key.toLowerCase())) {
        content = value
        break
      }
    }

    if (!content) {
      content = this.generateDefault(lastUser, opts.maxTokens ?? 200)
    }

    const words = content.split(/\s+/).length
    return {
      content,
      usage: {
        inputTokens: Math.ceil(lastUser.length / 4),
        outputTokens: words,
        totalTokens: Math.ceil(lastUser.length / 4) + words,
        isEstimated: true,
      },
      model: this.model,
      provider: this.name,
    }
  }

  private generateDefault(prompt: string, maxTokens: number): string {
    let content: string

    if (prompt.toLowerCase().includes("json")) {
      content = '{"score": 75, "suggestions": ["Add more quantified achievements", "Include relevant keywords"]}'
    } else if (prompt.toLowerCase().includes("cover letter")) {
      content = "Dear Hiring Manager,\n\nI am writing to express my interest in this position. My background makes me a strong fit for your team.\n\nSincerely,\n[Candidate]"
    } else if (prompt.toLowerCase().includes("summary")) {
      content = "Results-driven professional with demonstrated expertise delivering measurable outcomes. Strong collaborator with a track record of driving team success."
    } else {
      content = `Professional content generated for: ${prompt.slice(0, 50)}...`
    }

    return content.split(/\s+/).slice(0, Math.max(1, maxTokens)).join(" ")
  }
}
