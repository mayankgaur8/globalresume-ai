import type { AIProvider, ChatMessage, CompletionOptions, CompletionResult, TokenUsage } from "./base"

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  model: string
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai"
  readonly model: string

  constructor(
    private readonly apiKey: string,
    model = "gpt-4o-mini"
  ) {
    this.model = model
  }

  async complete(
    messages: ChatMessage[],
    opts: CompletionOptions = {},
    attempt = 1
  ): Promise<CompletionResult> {
    const { maxTokens = 500, temperature = 0.7 } = opts

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    })

    if (res.status === 429 && attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * attempt))
      return this.complete(messages, opts, attempt + 1)
    }

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = (await res.json()) as OpenAIResponse
    const content = data.choices[0]?.message?.content ?? ""

    const usage: TokenUsage = data.usage
      ? {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
          isEstimated: false,
        }
      : {
          inputTokens: Math.ceil(maxTokens * 0.6),
          outputTokens: Math.ceil(maxTokens * 0.4),
          totalTokens: maxTokens,
          isEstimated: true,
        }

    return { content, usage, model: this.model, provider: this.name }
  }
}
