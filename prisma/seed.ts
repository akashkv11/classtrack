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

  const scienceClass = await prisma.class.findFirst({
    where: {
      academicYearId: academicYear.id,
      level: "plus_one",
      stream: "science",
    },
  });
  const commerceClass = await prisma.class.findFirst({
    where: {
      academicYearId: academicYear.id,
      level: "plus_one",
      stream: "commerce",
    },
  });

  if (scienceClass) {
    await prisma.timetableEntry.deleteMany({ where: { classId: scienceClass.id } });
    await prisma.timetableEntry.create({
      data: {
        classId: scienceClass.id,
        subject: "Computer Science",
        scheduleType: "repeating",
        startTime: "09:30",
        endTime: "10:15",
        repeatDays: ["monday", "wednesday", "friday"],
        scheduleExceptions: [
          {
            date: "2026-07-01",
            start_time: "10:00",
            end_time: "10:45",
            notes: "One-time time change",
          },
        ],
        repeatStart: new Date("2026-06-01"),
        repeatEnd: new Date("2027-03-31"),
      },
    });
  }

  if (commerceClass) {
    await prisma.timetableEntry.deleteMany({ where: { classId: commerceClass.id } });
    await prisma.timetableEntry.create({
      data: {
        classId: commerceClass.id,
        subject: "Computer Application",
        scheduleType: "repeating",
        startTime: "11:15",
        endTime: "12:00",
        repeatDays: ["monday"],
        scheduleExceptions: [],
        repeatStart: new Date("2026-06-01"),
        repeatEnd: new Date("2027-03-31"),
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
