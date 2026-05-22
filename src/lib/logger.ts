/**
 * Structured logger — emits JSON in production, human-readable in dev.
 * Never logs secrets, passwords, or raw error stacks to clients.
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  userId?: string
  resumeId?: string
  requestId?: string
  route?: string
  durationMs?: number
  statusCode?: number
  [key: string]: string | number | boolean | undefined
}

function emit(level: LogLevel, message: string, ctx: LogContext = {}) {
  if (process.env.NODE_ENV === "test") return

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    env: process.env.NODE_ENV,
    ...ctx,
  }

  if (process.env.NODE_ENV === "production") {
    // JSON lines — compatible with Datadog, Vercel log drains, etc.
    process.stdout.write(JSON.stringify(entry) + "\n")
  } else {
    const prefix = `[${level.toUpperCase()}]`
    const ctxStr = Object.keys(ctx).length ? ` ${JSON.stringify(ctx)}` : ""
    // eslint-disable-next-line no-console
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `${prefix} ${message}${ctxStr}`
    )
  }
}

export const log = {
  debug: (msg: string, ctx?: LogContext) => emit("debug", msg, ctx),
  info:  (msg: string, ctx?: LogContext) => emit("info",  msg, ctx),
  warn:  (msg: string, ctx?: LogContext) => emit("warn",  msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit("error", msg, ctx),

  /** Log an API request — call at the end of every route handler. */
  request(route: string, method: string, statusCode: number, durationMs: number, ctx: LogContext = {}) {
    emit(statusCode >= 500 ? "error" : "info", `${method} ${route}`, {
      route, statusCode, durationMs, ...ctx,
    })
  },
}
