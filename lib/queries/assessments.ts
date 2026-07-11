import { prisma } from "@/lib/db";
import { formatISODate, parseISODate } from "@/lib/dates";
import { computeAssessmentSummary } from "@/lib/assessments/summary";
import { getActiveClasses } from "@/lib/queries/classes";
import type {
  AssessmentClassOverview,
  AssessmentDetail,
  AssessmentMarkRow,
  AssessmentResultSummary,
  AssessmentSummary,
  AssessmentType,
  StudentAssessmentHistory,
  StudentAssessmentHistoryEntry,
} from "@/lib/types/assessment";

const assessmentInclude = {
  syllabusSubject: { select: { id: true, subjectName: true } },
  syllabusChapter: { select: { id: true, chapterTitle: true } },
  topics: {
    include: {
      syllabusTopic: {
        select: {
          id: true,
          topicTitle: true,
          syllabusChapter: { select: { chapterTitle: true } },
        },
      },
    },
  },
  marks: { select: { marksObtained: true } },
} as const;

type DbAssessment = {
  id: string;
  name: string;
  assessmentType: string;
  assessmentDate: Date;
  maxMarks: number;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  syllabusSubject: { id: string; subjectName: string };
  syllabusChapter: { id: string; chapterTitle: string } | null;
  topics: {
    syllabusTopic: {
      id: string;
      topicTitle: string;
      syllabusChapter: { chapterTitle: string };
    };
  }[];
  marks: { marksObtained: number | null }[];
};

function mapAssessmentToSummary(
  assessment: DbAssessment,
  studentCount: number,
): AssessmentSummary {
  const withMarks = assessment.marks.filter((m) => m.marksObtained !== null);
  let classAverage: number | null = null;
  if (withMarks.length > 0) {
    const sum = withMarks.reduce((a, m) => a + (m.marksObtained as number), 0);
    classAverage = Math.round((sum / withMarks.length) * 10) / 10;
  }

  return {
    id: assessment.id,
    name: assessment.name,
    assessment_type: assessment.assessmentType as AssessmentType,
    assessment_date: formatISODate(assessment.assessmentDate),
    max_marks: assessment.maxMarks,
    subject: {
      id: assessment.syllabusSubject.id,
      name: assessment.syllabusSubject.subjectName,
    },
    chapter: assessment.syllabusChapter
      ? {
          id: assessment.syllabusChapter.id,
          chapter_title: assessment.syllabusChapter.chapterTitle,
        }
      : null,
    topics: assessment.topics.map((t) => ({
      id: t.syllabusTopic.id,
      topic_title: t.syllabusTopic.topicTitle,
      chapter_title: t.syllabusTopic.syllabusChapter.chapterTitle,
    })),
    remarks: assessment.remarks,
    marks_entered_count: withMarks.length,
    student_count: studentCount,
    class_average: classAverage,
    created_at: assessment.createdAt.toISOString(),
    updated_at: assessment.updatedAt.toISOString(),
  };
}

export type AssessmentListFilters = {
  subjectId?: string;
  assessmentType?: AssessmentType;
  dateFrom?: string;
  dateTo?: string;
};

export async function getAssessmentsForClass(
  classId: string,
  filters: AssessmentListFilters = {},
): Promise<AssessmentSummary[]> {
  const studentCount = await prisma.student.count({
    where: { classId, isActive: true },
  });

  const where: {
    classId: string;
    syllabusSubjectId?: string;
    assessmentType?: string;
    assessmentDate?: { gte?: Date; lte?: Date };
  } = { classId };

  if (filters.subjectId) where.syllabusSubjectId = filters.subjectId;
  if (filters.assessmentType) where.assessmentType = filters.assessmentType;
  if (filters.dateFrom || filters.dateTo) {
    where.assessmentDate = {};
    if (filters.dateFrom) where.assessmentDate.gte = parseISODate(filters.dateFrom);
    if (filters.dateTo) where.assessmentDate.lte = parseISODate(filters.dateTo);
  }

  const assessments = await prisma.assessment.findMany({
    where,
    include: assessmentInclude,
    orderBy: [{ assessmentDate: "desc" }, { createdAt: "desc" }],
  });

  return assessments.map((a) => mapAssessmentToSummary(a, studentCount));
}

export async function getAssessmentById(
  assessmentId: string,
): Promise<AssessmentDetail | null> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: assessmentInclude,
  });

  if (!assessment) return null;

  const studentCount = await prisma.student.count({
    where: { classId: assessment.classId, isActive: true },
  });

  const summary = mapAssessmentToSummary(assessment, studentCount);
  const resultSummary = computeAssessmentSummary(
    assessment.marks,
    assessment.maxMarks,
    studentCount,
  );

  return {
    ...summary,
    result_summary: resultSummary,
  };
}

export async function getAssessmentMarksGrid(
  assessmentId: string,
  classId: string,
): Promise<{
  assessment: AssessmentSummary;
  records: AssessmentMarkRow[];
  summary: AssessmentResultSummary;
} | null> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: assessmentInclude,
  });

  if (!assessment || assessment.classId !== classId) return null;

  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
    orderBy: { rollNo: "asc" },
  });

  const markRecords = await prisma.assessmentMark.findMany({
    where: { assessmentId },
  });
  const markMap = new Map(markRecords.map((m) => [m.studentId, m]));

  const records: AssessmentMarkRow[] = students.map((student) => {
    const mark = markMap.get(student.id);
    return {
      student_id: student.id,
      roll_no: student.rollNo,
      full_name: student.fullName,
      marks_obtained: mark?.marksObtained ?? null,
      remarks: mark?.remarks ?? null,
    };
  });

  const summary = computeAssessmentSummary(
    records.map((r) => ({ marksObtained: r.marks_obtained })),
    assessment.maxMarks,
    students.length,
  );

  return {
    assessment: mapAssessmentToSummary(assessment, students.length),
    records,
    summary,
  };
}

export async function getStudentAssessmentHistory(
  classId: string,
  studentId: string,
): Promise<StudentAssessmentHistory | null> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
  });

  if (!student) return null;

  const marks = await prisma.assessmentMark.findMany({
    where: { studentId },
    include: {
      assessment: {
        include: {
          syllabusSubject: { select: { subjectName: true } },
        },
      },
    },
    orderBy: {
      assessment: { assessmentDate: "desc" },
    },
  });

  const classAssessments = await prisma.assessment.findMany({
    where: { classId },
    select: { id: true },
  });
  const classAssessmentIds = new Set(classAssessments.map((a) => a.id));

  const entries: StudentAssessmentHistoryEntry[] = marks
    .filter((m) => classAssessmentIds.has(m.assessmentId))
    .map((m) => {
      const pct =
        m.marksObtained !== null
          ? Math.round((m.marksObtained / m.assessment.maxMarks) * 1000) / 10
          : null;
      return {
        assessment_id: m.assessmentId,
        assessment_name: m.assessment.name,
        assessment_type: m.assessment.assessmentType as AssessmentType,
        assessment_date: formatISODate(m.assessment.assessmentDate),
        subject_name: m.assessment.syllabusSubject.subjectName,
        max_marks: m.assessment.maxMarks,
        marks_obtained: m.marksObtained,
        percentage: pct,
        remarks: m.remarks,
      };
    });

  const percentages = entries
    .filter((e) => e.percentage !== null)
    .map((e) => e.percentage as number);
  const averagePercentage =
    percentages.length > 0
      ? Math.round(
          (percentages.reduce((a, b) => a + b, 0) / percentages.length) * 10,
        ) / 10
      : null;

  return {
    student_id: student.id,
    student_name: student.fullName,
    roll_no: student.rollNo,
    entries,
    average_percentage: averagePercentage,
  };
}

export async function getAssessmentsOverviewForActiveYear(): Promise<{
  activeYear: { id: string; name: string } | null;
  classes: AssessmentClassOverview[];
}> {
  const { activeYear, classes } = await getActiveClasses();

  if (!activeYear) {
    return { activeYear: null, classes: [] };
  }

  const overviews = await Promise.all(
    classes.map(async (cls) => {
      const [count, latest] = await Promise.all([
        prisma.assessment.count({ where: { classId: cls.id } }),
        prisma.assessment.findFirst({
          where: { classId: cls.id },
          orderBy: [{ assessmentDate: "desc" }, { createdAt: "desc" }],
          select: { assessmentDate: true },
        }),
      ]);

      return {
        class_id: cls.id,
        display_name: cls.displayName,
        assessments_count: count,
        latest_assessment_date: latest
          ? formatISODate(latest.assessmentDate)
          : null,
      };
    }),
  );

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes: overviews,
  };
}
