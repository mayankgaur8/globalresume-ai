export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface CompletionOptions {
  maxTokens?: number
  temperature?: number
  /** If true, caller receives the raw text stream (SSE). */
  stream?: boolean
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  isEstimated: boolean
}

export interface CompletionResult {
  content: string
  usage: TokenUsage
  model: string
  provider: string
}

export interface AIProvider {
  readonly name: string
  readonly model: string
  complete(messages: ChatMessage[], opts?: CompletionOptions): Promise<CompletionResult>
}
