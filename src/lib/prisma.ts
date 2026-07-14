import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// Global singleton to avoid exhausting the connection pool in dev
// (Next.js hot-reloads modules, which would create a new client each time).
export const prisma = globalThis.__prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
