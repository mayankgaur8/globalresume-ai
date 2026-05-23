import prisma from "./prisma"

// ── Admin bypass ───────────────────────────────────────────────────────────────
// Emails listed here receive full ADMIN limits regardless of their DB role.
// This lets the owner test every paid feature without a Razorpay payment.
const ADMIN_EMAILS = new Set(["mayankgaur.8@gmail.com"])

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email)
}

// ── Plan feature matrix ────────────────────────────────────────────────────────

export type PlanName = "FREE" | "BASIC" | "PRO" | "GLOBAL" | "ADMIN"

export interface PlanLimits {
  plan: PlanName
  maxResumes: number
  maxLanguages: number
  maxTemplates: number
  hasWatermark: boolean
  hasAIAccess: boolean
  aiCreditsPerMonth: number
  canExportDocx: boolean
  canUsePriorityExport: boolean
  canAccessAllTemplates: boolean
  canUseATSChecker: boolean
  canUseCoverLetterAI: boolean
}

const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  FREE: {
    plan: "FREE",
    maxResumes: 3,
    maxLanguages: 1,
    maxTemplates: 1,
    hasWatermark: true,
    hasAIAccess: true,
    aiCreditsPerMonth: 5,
    canExportDocx: false,
    canUsePriorityExport: false,
    canAccessAllTemplates: false,
    canUseATSChecker: false,
    canUseCoverLetterAI: false,
  },
  BASIC: {
    plan: "BASIC",
    maxResumes: 10,
    maxLanguages: 1,
    maxTemplates: 3,
    hasWatermark: false,
    hasAIAccess: true,
    aiCreditsPerMonth: 50,
    canExportDocx: false,
    canUsePriorityExport: false,
    canAccessAllTemplates: false,
    canUseATSChecker: false,
    canUseCoverLetterAI: false,
  },
  PRO: {
    plan: "PRO",
    maxResumes: 999,
    maxLanguages: 3,
    maxTemplates: 8,
    hasWatermark: false,
    hasAIAccess: true,
    aiCreditsPerMonth: 999,
    canExportDocx: true,
    canUsePriorityExport: true,
    canAccessAllTemplates: false,
    canUseATSChecker: true,
    canUseCoverLetterAI: false,
  },
  GLOBAL: {
    plan: "GLOBAL",
    maxResumes: 999,
    maxLanguages: 999,
    maxTemplates: 999,
    hasWatermark: false,
    hasAIAccess: true,
    aiCreditsPerMonth: 9999,
    canExportDocx: true,
    canUsePriorityExport: true,
    canAccessAllTemplates: true,
    canUseATSChecker: true,
    canUseCoverLetterAI: true,
  },
  ADMIN: {
    plan: "ADMIN",
    maxResumes: 999,
    maxLanguages: 999,
    maxTemplates: 999,
    hasWatermark: false,
    hasAIAccess: true,
    aiCreditsPerMonth: 9999,
    canExportDocx: true,
    canUsePriorityExport: true,
    canAccessAllTemplates: true,
    canUseATSChecker: true,
    canUseCoverLetterAI: true,
  },
}

// ── Core access functions ──────────────────────────────────────────────────────

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      role: true,
      subscription: { include: { plan: true } },
    },
  })

  if (!user) return PLAN_LIMITS.FREE
  if (user.role === "ADMIN" || isAdminEmail(user.email)) return PLAN_LIMITS.ADMIN

  const planName = (user.subscription?.plan?.name as PlanName) ?? "FREE"
  return PLAN_LIMITS[planName] ?? PLAN_LIMITS.FREE
}

export async function canAccessTemplate(userId: string, templateId: string): Promise<boolean> {
  const [limits, template] = await Promise.all([
    getUserPlanLimits(userId),
    prisma.template.findUnique({ where: { id: templateId } }),
  ])

  if (!template) return false
  if (!template.isPremium) return true
  if (limits.canAccessAllTemplates) return true

  // Check individual unlock
  const unlock = await prisma.purchasedTemplate.findUnique({
    where: { userId_templateId: { userId, templateId } },
  })
  return !!unlock
}

export async function canAccessLanguage(userId: string, languageCode: string): Promise<boolean> {
  const [limits, language] = await Promise.all([
    getUserPlanLimits(userId),
    prisma.language.findUnique({ where: { code: languageCode } }),
  ])

  if (!language) return false
  if (!language.isPremium) return true
  if (limits.maxLanguages >= 999) return true

  // Check individual unlock
  const unlock = await prisma.purchasedLanguage.findUnique({
    where: { userId_languageId: { userId, languageId: language.id } },
  })
  return !!unlock
}

export async function getMonthlyAIUsage(userId: string): Promise<number> {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const logs = await prisma.aIUsageLog.findMany({
    where: { userId, createdAt: { gte: start } },
    select: { tokens: true },
  })

  return logs.reduce((sum, l) => sum + l.tokens, 0)
}

export async function canUseAI(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getUserPlanLimits(userId)

  if (!limits.hasAIAccess) {
    return { allowed: false, reason: "Your plan does not include AI access" }
  }

  // Count requests this month (1 request = 1 credit for simplicity)
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const count = await prisma.aIUsageLog.count({
    where: { userId, createdAt: { gte: start } },
  })

  if (count >= limits.aiCreditsPerMonth) {
    return {
      allowed: false,
      reason: `You've used all ${limits.aiCreditsPerMonth} AI credits this month. Upgrade to get more.`,
    }
  }

  return { allowed: true }
}
