import prisma from "./prisma";

export async function getUserPlanLimits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: {
        include: { plan: true }
      }
    }
  });

  const planName = user?.subscription?.plan?.name || "FREE";
  
  if (user?.role === "ADMIN") {
    return { plan: "ADMIN", maxLanguages: 999, maxTemplates: 999, hasWatermark: false };
  }

  switch (planName) {
    case "GLOBAL":
      return { plan: "GLOBAL", maxLanguages: 999, maxTemplates: 999, hasWatermark: false };
    case "PRO":
      return { plan: "PRO", maxLanguages: 3, maxTemplates: 8, hasWatermark: false };
    case "BASIC":
      return { plan: "BASIC", maxLanguages: 1, maxTemplates: 3, hasWatermark: false };
    case "FREE":
    default:
      return { plan: "FREE", maxLanguages: 1, maxTemplates: 1, hasWatermark: true };
  }
}

export async function canAccessTemplate(userId: string, templateId: string) {
  const limits = await getUserPlanLimits(userId);
  if (limits.plan === "ADMIN" || limits.plan === "GLOBAL") return true;

  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) return false;
  
  if (!template.isPremium) return true;

  // Check manual unlocks
  const unlock = await prisma.purchasedTemplate.findUnique({
    where: { userId_templateId: { userId, templateId } }
  });

  if (unlock) return true;
  
  // Basic/Pro users would rely on manual unlocks if they choose premium templates, 
  // or we map specific template counts. For simplicity, we just allow Basic/Pro to access
  // up to their limit in the UI, but strict server check is here.
  return false;
}

export async function canAccessLanguage(userId: string, languageCode: string) {
  const limits = await getUserPlanLimits(userId);
  if (limits.plan === "ADMIN" || limits.plan === "GLOBAL") return true;

  const language = await prisma.language.findUnique({ where: { code: languageCode } });
  if (!language) return false;

  if (!language.isPremium) return true; // English is free

  const unlock = await prisma.purchasedLanguage.findUnique({
    where: {
      userId_languageId: {
        userId,
        languageId: language.id
      }
    }
  });

  if (unlock) return true;

  return false;
}
