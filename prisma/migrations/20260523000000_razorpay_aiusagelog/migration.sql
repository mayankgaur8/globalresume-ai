-- AddColumn AIUsageLog: inputTokens
ALTER TABLE "AIUsageLog" ADD COLUMN IF NOT EXISTS "inputTokens" INTEGER NOT NULL DEFAULT 0;

-- AddColumn AIUsageLog: outputTokens
ALTER TABLE "AIUsageLog" ADD COLUMN IF NOT EXISTS "outputTokens" INTEGER NOT NULL DEFAULT 0;

-- AddColumn AIUsageLog: isEstimated
ALTER TABLE "AIUsageLog" ADD COLUMN IF NOT EXISTS "isEstimated" BOOLEAN NOT NULL DEFAULT false;

-- AddColumn AIUsageLog: provider
ALTER TABLE "AIUsageLog" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'openai';

-- AddColumn AIUsageLog: model
ALTER TABLE "AIUsageLog" ADD COLUMN IF NOT EXISTS "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini';

-- CreateIndex AIUsageLog(userId, createdAt)
CREATE INDEX IF NOT EXISTS "AIUsageLog_userId_createdAt_idx" ON "AIUsageLog"("userId", "createdAt");

-- CreateIndex Resume(userId)
CREATE INDEX IF NOT EXISTS "Resume_userId_idx" ON "Resume"("userId");

-- CreateIndex Resume(updatedAt)
CREATE INDEX IF NOT EXISTS "Resume_updatedAt_idx" ON "Resume"("updatedAt");

-- CreateIndex Subscription(stripeSubId)
CREATE INDEX IF NOT EXISTS "Subscription_stripeSubId_idx" ON "Subscription"("stripeSubId");

-- CreateTable RazorpayOrder
CREATE TABLE IF NOT EXISTS "RazorpayOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'created',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RazorpayOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex RazorpayOrder(orderId) unique
CREATE UNIQUE INDEX IF NOT EXISTS "RazorpayOrder_orderId_key" ON "RazorpayOrder"("orderId");

-- CreateIndex RazorpayOrder(userId)
CREATE INDEX IF NOT EXISTS "RazorpayOrder_userId_idx" ON "RazorpayOrder"("userId");

-- CreateIndex RazorpayOrder(orderId)
CREATE INDEX IF NOT EXISTS "RazorpayOrder_orderId_idx" ON "RazorpayOrder"("orderId");

-- AddForeignKey RazorpayOrder -> User
ALTER TABLE "RazorpayOrder" ADD CONSTRAINT "RazorpayOrder_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey RazorpayOrder -> Plan (via planName -> name)
ALTER TABLE "RazorpayOrder" ADD CONSTRAINT "RazorpayOrder_planName_fkey"
    FOREIGN KEY ("planName") REFERENCES "Plan"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
