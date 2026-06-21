function decodePrismaDevDatabaseUrl(
  prismaDevUrl: string,
  field: "databaseUrl" | "shadowDatabaseUrl",
): string | undefined {
  try {
    const apiKey = new URL(prismaDevUrl).searchParams.get("api_key");
    if (!apiKey) return undefined;

    const payload = JSON.parse(atob(apiKey)) as Record<string, string>;
    return payload[field];
  } catch {
    return undefined;
  }
}

export function getDirectDatabaseUrl(): string {
  const configured =
    process.env.DIRECT_DATABASE_URL ??
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL;
  if (!configured) {
    throw new Error("DATABASE_URL is not set");
  }

  if (configured.startsWith("prisma+postgres://")) {
    const directUrl = decodePrismaDevDatabaseUrl(configured, "databaseUrl");
    if (!directUrl) {
      throw new Error(
        "DATABASE_URL uses prisma+postgres:// but no direct database URL was found. Start `npx prisma dev` or set DIRECT_DATABASE_URL.",
      );
    }
    return directUrl;
  }

  return configured;
}

export function getShadowDatabaseUrl(): string | undefined {
  if (process.env.SHADOW_DATABASE_URL) {
    return process.env.SHADOW_DATABASE_URL;
  }

  const configured = process.env.DATABASE_URL;
  if (!configured?.startsWith("prisma+postgres://")) {
    return undefined;
  }

  return decodePrismaDevDatabaseUrl(configured, "shadowDatabaseUrl");
}
