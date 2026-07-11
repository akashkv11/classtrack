import { prisma } from "@/lib/db";
import { formatISODate, parseISODate } from "@/lib/dates";
import { getActiveClasses } from "@/lib/queries/classes";
import type {
  CommunicationReason,
  CommunicationStatus,
  CommunicationType,
  ParentCommunicationClassOverview,
  ParentCommunicationSummary,
  StudentNoteOption,
} from "@/lib/types/parent-communication";

type DbCommunication = {
  id: string;
  communicationDate: Date;
  communicationType: string;
  reason: string;
  summary: string;
  followUpNeeded: boolean;
  followUpDate: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  studentNote: {
    id: string;
    noteDate: Date;
    category: string;
    noteText: string;
  } | null;
};

const communicationInclude = {
  studentNote: {
    select: {
      id: true,
      noteDate: true,
      category: true,
      noteText: true,
    },
  },
} as const;

export function mapCommunicationToJson(
  record: DbCommunication,
): ParentCommunicationSummary {
  return {
    id: record.id,
    communication_date: formatISODate(record.communicationDate),
    communication_type: record.communicationType as CommunicationType,
    reason: record.reason as CommunicationReason,
    summary: record.summary,
    linked_note: record.studentNote
      ? {
          id: record.studentNote.id,
          note_date: formatISODate(record.studentNote.noteDate),
          category: record.studentNote.category,
          note_text: record.studentNote.noteText,
        }
      : null,
    follow_up_needed: record.followUpNeeded,
    follow_up_date: record.followUpDate
      ? formatISODate(record.followUpDate)
      : null,
    status: record.status as CommunicationStatus,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString(),
  };
}

export async function getParentCommunications(
  classId: string,
  studentId: string,
): Promise<ParentCommunicationSummary[]> {
  const records = await prisma.parentCommunication.findMany({
    where: { classId, studentId },
    include: communicationInclude,
    orderBy: [{ communicationDate: "desc" }, { createdAt: "desc" }],
  });

  return records.map(mapCommunicationToJson);
}

export async function getParentCommunicationById(
  communicationId: string,
): Promise<ParentCommunicationSummary | null> {
  const record = await prisma.parentCommunication.findUnique({
    where: { id: communicationId },
    include: communicationInclude,
  });

  return record ? mapCommunicationToJson(record) : null;
}

export async function getStudentNoteOptions(
  classId: string,
  studentId: string,
): Promise<StudentNoteOption[]> {
  const notes = await prisma.studentNote.findMany({
    where: { classId, studentId },
    orderBy: [{ noteDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      noteDate: true,
      category: true,
      noteText: true,
    },
  });

  return notes.map((note) => ({
    id: note.id,
    note_date: formatISODate(note.noteDate),
    category: note.category,
    note_text: note.noteText,
  }));
}

export function parseCommunicationDates(data: {
  communication_date: string;
  follow_up_date?: string | null;
}) {
  return {
    communicationDate: parseISODate(data.communication_date),
    followUpDate: data.follow_up_date ? parseISODate(data.follow_up_date) : null,
  };
}

export async function getParentCommunicationOverviewForActiveYear(): Promise<{
  activeYear: { id: string; name: string } | null;
  classes: ParentCommunicationClassOverview[];
}> {
  const { activeYear, classes } = await getActiveClasses();

  if (!activeYear) {
    return { activeYear: null, classes: [] };
  }

  const overviews = await Promise.all(
    classes.map(async (cls) => {
      const [studentCount, communicationsCount, openFollowUpsCount] =
        await Promise.all([
          prisma.student.count({ where: { classId: cls.id, isActive: true } }),
          prisma.parentCommunication.count({ where: { classId: cls.id } }),
          prisma.parentCommunication.count({
            where: {
              classId: cls.id,
              status: { in: ["OPEN", "FOLLOW_UP_NEEDED"] },
            },
          }),
        ]);

      return {
        class_id: cls.id,
        display_name: cls.displayName,
        student_count: studentCount,
        communications_count: communicationsCount,
        open_follow_ups_count: openFollowUpsCount,
      };
    }),
  );

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes: overviews,
  };
}
