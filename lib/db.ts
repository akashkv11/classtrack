import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { getDatabaseUrl } from "@/lib/database-url";
import { Pool } from "pg";

const globalForDatabase = globalThis as unknown as {
  pgPool?: Pool;
  prisma?: PrismaClient;
  prismaConstructor?: typeof PrismaClient;
};

function createPool(): Pool {
  return new Pool({
    connectionString: getDatabaseUrl(),
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    maxLifetimeSeconds: 300,
  });
}

const pool = globalForDatabase.pgPool ?? createPool();

const adapter = new PrismaPg(pool);

// Refresh the cached client after generation changes, including new fields on existing models.
const cachedClient = globalForDatabase.prisma;
const canReuseClient = cachedClient && globalForDatabase.prismaConstructor === PrismaClient;

export const prisma =
  (canReuseClient ? cachedClient : undefined) ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

globalForDatabase.pgPool = pool;
globalForDatabase.prisma = prisma;
globalForDatabase.prismaConstructor = PrismaClient;
