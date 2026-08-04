import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Helper: resolve college name to ID
export async function resolveCollegeId(name: string | null): Promise<string | null> {
  if (!name) return null;
  const college = await prisma.college.findFirst({ where: { name } });
  return college?.id || null;
}
