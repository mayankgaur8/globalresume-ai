import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
  try {
    const result = await prisma.$queryRaw<[{ ok: number }]>`SELECT 1 as ok`

    return NextResponse.json({
      status: "ok",
      db: "connected",
      result: result[0]?.ok ?? 1,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error(`[DB_ERROR] ${JSON.stringify({
      operation: "health.db",
      name: err instanceof Error ? err.name : typeof err,
      code: typeof err === "object" && err && "code" in err ? (err as { code?: unknown }).code : undefined,
      message: err instanceof Error ? err.message : String(err),
    })}`)

    return NextResponse.json(
      {
        status: "error",
        db: "unreachable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
