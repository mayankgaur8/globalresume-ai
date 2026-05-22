import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// @prisma/adapter-pg v7+ takes { connectionString } directly — no Pool needed.
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL environment variable is not set")
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof createPrismaClient>
}

const prisma = globalThis.prismaGlobal ?? createPrismaClient()

export default prisma

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma
