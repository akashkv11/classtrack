import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { getDatabaseUrl } from "@/lib/database-url";
import { Pool } from "pg";

const globalForDatabase = globalThis as unknown as {
  pgPool?: Pool;
  prisma?: PrismaClient;
};

function createPool(): Pool {
  return new Pool({
    connectionString: getDatabaseUrl(),
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    maxLifetimeSeconds: 60,
  });
}

const pool = globalForDatabase.pgPool ?? createPool();

const adapter = new PrismaPg(pool);

export const prisma =
  globalForDatabase.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

globalForDatabase.pgPool = pool;
globalForDatabase.prisma = prisma;
