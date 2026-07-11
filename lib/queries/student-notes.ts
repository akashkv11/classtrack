import { prisma } from "@/lib/db";
import { formatISODate, parseISODate } from "@/lib/dates";
import { getActiveClasses } from "@/lib/queries/classes";
import type {
  NoteCategory,
  NoteStatus,
  StudentNoteSummary,
  StudentNotesClassOverview,
} from "@/lib/types/student-note";

type DbNote = {
  id: string;
  noteDate: Date;
  category: string;
  noteText: string;
  followUpNeeded: boolean;
  followUpDate: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function mapNoteToJson(note: DbNote): StudentNoteSummary {
  return {
    id: note.id,
    note_date: formatISODate(note.noteDate),
    category: note.category as NoteCategory,
    note_text: note.noteText,
    follow_up_needed: note.followUpNeeded,
    follow_up_date: note.followUpDate ? formatISODate(note.followUpDate) : null,
    status: note.status as NoteStatus,
    created_at: note.createdAt.toISOString(),
    updated_at: note.updatedAt.toISOString(),
  };
}

export async function getStudentNotes(
  classId: string,
  studentId: string,
): Promise<StudentNoteSummary[]> {
  const notes = await prisma.studentNote.findMany({
    where: { classId, studentId },
    orderBy: [{ noteDate: "desc" }, { createdAt: "desc" }],
  });

  return notes.map(mapNoteToJson);
}

export async function getStudentNoteById(
  noteId: string,
): Promise<StudentNoteSummary | null> {
  const note = await prisma.studentNote.findUnique({
    where: { id: noteId },
  });

  return note ? mapNoteToJson(note) : null;
}

export function parseNoteDates(data: {
  note_date: string;
  follow_up_date?: string | null;
}) {
  return {
    noteDate: parseISODate(data.note_date),
    followUpDate: data.follow_up_date ? parseISODate(data.follow_up_date) : null,
  };
}

export async function getStudentNotesOverviewForActiveYear(): Promise<{
  activeYear: { id: string; name: string } | null;
  classes: StudentNotesClassOverview[];
}> {
  const { activeYear, classes } = await getActiveClasses();

  if (!activeYear) {
    return { activeYear: null, classes: [] };
  }

  const overviews = await Promise.all(
    classes.map(async (cls) => {
      const [studentCount, notesCount, openNotesCount] = await Promise.all([
        prisma.student.count({ where: { classId: cls.id, isActive: true } }),
        prisma.studentNote.count({ where: { classId: cls.id } }),
        prisma.studentNote.count({ where: { classId: cls.id, status: "OPEN" } }),
      ]);

      return {
        class_id: cls.id,
        display_name: cls.displayName,
        student_count: studentCount,
        notes_count: notesCount,
        open_notes_count: openNotesCount,
      };
    }),
  );

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes: overviews,
  };
}
