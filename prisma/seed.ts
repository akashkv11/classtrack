import { prisma } from "../lib/db";

async function main() {
  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2026-2027" },
    create: {
      name: "2026-2027",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2027-03-31"),
      isActive: true,
    },
    update: { isActive: true },
  });

  const classDefinitions = [
    { level: "plus_one", stream: "science", displayName: "Plus One Science" },
    { level: "plus_one", stream: "commerce", displayName: "Plus One Commerce" },
    { level: "plus_two", stream: "science", displayName: "Plus Two Science" },
    { level: "plus_two", stream: "commerce", displayName: "Plus Two Commerce" },
  ] as const;

  for (const def of classDefinitions) {
    await prisma.class.upsert({
      where: {
        academicYearId_level_stream: {
          academicYearId: academicYear.id,
          level: def.level,
          stream: def.stream,
        },
      },
      create: {
        academicYearId: academicYear.id,
        level: def.level,
        stream: def.stream,
        displayName: def.displayName,
      },
      update: {
        displayName: def.displayName,
        isActive: true,
      },
    });
  }

  await prisma.appSetting.upsert({
    where: { key: "message_signature" },
    create: { key: "message_signature", value: "- Class Teacher" },
    update: {},
  });

  await prisma.appSetting.upsert({
    where: { key: "late_counts_as_present" },
    create: { key: "late_counts_as_present", value: "true" },
    update: {},
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
