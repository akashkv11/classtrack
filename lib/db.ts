import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { getDatabaseUrl } from "@/lib/database-url";
import { Pool } from "pg";

const globalForDatabase = globalThis as unknown as {
  pgPool?: Pool;
  prisma?: PrismaClient;
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

// Regenerating Prisma during development can leave the global client missing new models.
const cachedClient = globalForDatabase.prisma;
const hasCurrentModels = cachedClient && Object.values(Prisma.ModelName).every((name) =>
  `${name[0].toLowerCase()}${name.slice(1)}` in cachedClient,
);

export const prisma =
  (hasCurrentModels ? cachedClient : undefined) ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

globalForDatabase.pgPool = pool;
globalForDatabase.prisma = prisma;
