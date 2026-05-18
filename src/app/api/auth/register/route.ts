import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TRANSIENT_DB_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "P1000",
  "P1001",
  "P1002",
  "P1017",
])

type RegisterErrorCode =
  | "INVALID_PAYLOAD"
  | "EMAIL_EXISTS"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "SERVER_ERROR"

function errorResponse(message: string, status: number, code: RegisterErrorCode, headers?: HeadersInit) {
  return NextResponse.json({ message, code }, { status, headers })
}

function isPrismaKnownError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError
}

function getErrorCode(err: unknown) {
  if (typeof err === "object" && err && "code" in err) {
    const code = (err as { code?: unknown }).code
    if (typeof code === "string") return code
  }
  return undefined
}

function logDbError(err: unknown, context: Record<string, unknown>) {
  console.error(`[DB_ERROR] ${JSON.stringify({
    ...context,
    name: err instanceof Error ? err.name : typeof err,
    code: getErrorCode(err),
    message: err instanceof Error ? err.message : String(err),
    meta: isPrismaKnownError(err) ? err.meta : undefined,
  })}`)
}

function isTransientDbError(err: unknown) {
  const code = getErrorCode(err)
  if (code && TRANSIENT_DB_CODES.has(code)) return true

  const message = err instanceof Error ? err.message : String(err)
  return /connection|connect|timeout|terminating connection|prepared statement/i.test(message)
}

async function withDbRetry<T>(operation: string, fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      logDbError(err, { operation, attempt })

      if (!isTransientDbError(err) || attempt === attempts) break
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt))
    }
  }

  throw lastError
}

export async function POST(req: Request) {
  // Rate limit: 5 registrations per IP per 15 minutes
  const ip = getClientIp(req)
  const rl = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.success) {
    return errorResponse(
      "Too many requests. Please wait before trying again.",
      429,
      "RATE_LIMITED",
      { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) }
    )
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return errorResponse("Invalid request body", 400, "INVALID_PAYLOAD")
    }

    const { email, password, name } = body as {
      email?: unknown
      password?: unknown
      name?: unknown
    }

    // Strict type + format validation
    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return errorResponse("Valid email address is required", 400, "INVALID_PAYLOAD")
    }
    if (typeof password !== "string" || password.length < 8) {
      return errorResponse("Password must be at least 8 characters", 400, "INVALID_PAYLOAD")
    }
    if (password.length > 128) {
      return errorResponse("Password is too long", 400, "INVALID_PAYLOAD")
    }

    const normalizedEmail = email.toLowerCase().trim()
    const safeName = typeof name === "string" ? name.trim().slice(0, 100) || null : null

    console.info(`[SIGNUP_API] ${JSON.stringify({
      event: "request",
      email: normalizedEmail,
      hasName: Boolean(safeName),
      ip,
    })}`)

    const existing = await withDbRetry("user.findUnique", () =>
      prisma.user.findUnique({ where: { email: normalizedEmail } })
    )
    if (existing) {
      return errorResponse("Email already exists", 409, "EMAIL_EXISTS")
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await withDbRetry("user.create", () =>
      prisma.$transaction(async (tx) => {
        const freePlan = await tx.plan.findUnique({ where: { name: "FREE" } })

        return tx.user.create({
          data: {
            email: normalizedEmail,
            name: safeName,
            hashedPassword,
            ...(freePlan
              ? { subscription: { create: { status: "active", planId: freePlan.id } } }
              : {}),
          },
          select: { id: true, email: true, name: true, role: true },
        })
      })
    )

    console.info(`[SIGNUP_API] ${JSON.stringify({
      event: "created",
      userId: user.id,
      email: user.email,
      status: 201,
    })}`)

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error(`[SIGNUP_API] ${JSON.stringify({
      event: "failed",
      name: err instanceof Error ? err.name : typeof err,
      code: getErrorCode(err),
      message: err instanceof Error ? err.message : String(err),
      meta: isPrismaKnownError(err) ? err.meta : undefined,
    })}`)

    if (isPrismaKnownError(err) && err.code === "P2002") {
      return errorResponse("Email already exists", 409, "EMAIL_EXISTS")
    }

    if (isTransientDbError(err)) {
      return errorResponse(
        "Database unavailable. Please try again in a moment.",
        503,
        "DATABASE_UNAVAILABLE"
      )
    }

    return errorResponse("Server temporarily unavailable. Please try again.", 500, "SERVER_ERROR")
  }
}
