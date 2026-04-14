import { prisma } from "@/lib/prisma";

const LIMITS: Record<string, { maxCount: number; windowHours: number }> = {
  "ai-search":    { maxCount: 20, windowHours: 1 },
  "ai-customize": { maxCount: 10, windowHours: 24 },
  "ai-bizplan":   { maxCount: 5,  windowHours: 24 },
};

export async function checkAiRateLimit(
  identifier: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetIn: string }> {
  const limit = LIMITS[endpoint];
  if (!limit) return { allowed: true, remaining: 999, resetIn: "" };

  const windowStart = new Date(Date.now() - limit.windowHours * 60 * 60 * 1000);

  const count = await prisma.aiUsageLog.count({
    where: {
      identifier,
      endpoint,
      createdAt: { gte: windowStart },
    },
  });

  const remaining = Math.max(0, limit.maxCount - count);
  const allowed = count < limit.maxCount;
  const resetIn = limit.windowHours === 1 ? "1時間後" : "24時間後";

  return { allowed, remaining, resetIn };
}

export async function recordAiUsage(identifier: string, endpoint: string) {
  await prisma.aiUsageLog.create({
    data: { identifier, endpoint },
  });
}
