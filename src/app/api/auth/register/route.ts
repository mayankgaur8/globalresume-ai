import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  // Rate limit: 5 registrations per IP per 15 minutes
  const ip = getClientIp(req)
  const rl = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.success) {
    return new NextResponse("Too many requests. Please wait before trying again.", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) },
    })
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body) return new NextResponse("Invalid request body", { status: 400 })

    const { email, password, name } = body as {
      email?: unknown
      password?: unknown
      name?: unknown
    }

    // Strict type + format validation
    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return new NextResponse("Valid email address is required", { status: 400 })
    }
    if (typeof password !== "string" || password.length < 8) {
      return new NextResponse("Password must be at least 8 characters", { status: 400 })
    }
    if (password.length > 128) {
      return new NextResponse("Password is too long", { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return new NextResponse("An account with this email already exists", { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const freePlan = await prisma.plan.findUnique({ where: { name: "FREE" } })

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: typeof name === "string" ? name.trim().slice(0, 100) || null : null,
        hashedPassword,
        ...(freePlan
          ? { subscription: { create: { status: "active", planId: freePlan.id } } }
          : {}),
      },
      select: { id: true, email: true, name: true, role: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error("[register] error:", err)
    return new NextResponse("Registration failed. Please try again.", { status: 500 })
  }
}
