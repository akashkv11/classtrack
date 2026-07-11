import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { COMMUNICATION_REASON_LABELS } from "@/lib/parent-communication/status";
import { NOTE_CATEGORY_LABELS } from "@/lib/student-notes/status";
import {
  getAllSettings,
  mapSettingsRecord,
  setSetting,
  SETTING_CONTINUOUS_ABSENCE_THRESHOLD,
  SETTING_INSTITUTION_NAME,
  SETTING_LATE_COUNTS_AS_PRESENT,
  SETTING_LOW_ATTENDANCE_THRESHOLD,
  SETTING_LOW_MARKS_THRESHOLD_PERCENT,
  SETTING_MESSAGE_SIGNATURE,
  SETTING_MONTHLY_ABSENCE_THRESHOLD,
  SETTING_REPORT_FOOTER,
  SETTING_REPORT_TITLE,
  SETTING_TEACHER_NAME,
} from "@/lib/settings";
import { getActiveAcademicYear } from "@/lib/queries/classes";
import {
  parseInput,
  settingsPatchSchema,
  validationErrorResponse,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const [academicYears, settings, activeYear] = await Promise.all([
    prisma.academicYear.findMany({ orderBy: { startDate: "desc" } }),
    getAllSettings(),
    getActiveAcademicYear(),
  ]);

  const classes = activeYear
    ? await prisma.class.findMany({
        where: { academicYearId: activeYear.id, isActive: true },
        orderBy: [{ level: "asc" }, { stream: "asc" }],
        include: {
          syllabusSubjects: {
            select: { id: true, subjectName: true },
            orderBy: { createdAt: "asc" },
          },
        },
      })
    : [];

  return NextResponse.json({
    academic_years: academicYears.map((y) => ({
      id: y.id,
      name: y.name,
      is_active: y.isActive,
    })),
    classes: classes.map((cls) => ({
      class_id: cls.id,
      display_name: cls.displayName,
      subjects: cls.syllabusSubjects.map((subject) => ({
        id: subject.id,
        name: subject.subjectName,
      })),
    })),
    settings: mapSettingsRecord(settings),
    communication: {
      parent_reasons: Object.values(COMMUNICATION_REASON_LABELS),
      note_categories: Object.values(NOTE_CATEGORY_LABELS),
    },
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const parsed = parseInput(settingsPatchSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const data = parsed.data;

  if (data.active_academic_year_id) {
    const year = await prisma.academicYear.findUnique({
      where: { id: data.active_academic_year_id },
    });

    if (!year) {
      return NextResponse.json(
        {
          error: "Selected academic year does not exist",
          field_errors: { active_academic_year_id: "Selected academic year does not exist" },
        },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.academicYear.updateMany({ data: { isActive: false } }),
      prisma.academicYear.update({
        where: { id: data.active_academic_year_id },
        data: { isActive: true },
      }),
    ]);
  }

  const settingUpdates: [string, string][] = [];

  if (data.message_signature !== undefined) {
    settingUpdates.push([SETTING_MESSAGE_SIGNATURE, data.message_signature]);
  }
  if (data.late_counts_as_present !== undefined) {
    settingUpdates.push([
      SETTING_LATE_COUNTS_AS_PRESENT,
      data.late_counts_as_present ? "true" : "false",
    ]);
  }
  if (data.low_attendance_threshold !== undefined) {
    settingUpdates.push([
      SETTING_LOW_ATTENDANCE_THRESHOLD,
      String(data.low_attendance_threshold),
    ]);
  }
  if (data.continuous_absence_threshold !== undefined) {
    settingUpdates.push([
      SETTING_CONTINUOUS_ABSENCE_THRESHOLD,
      String(data.continuous_absence_threshold),
    ]);
  }
  if (data.monthly_absence_threshold !== undefined) {
    settingUpdates.push([
      SETTING_MONTHLY_ABSENCE_THRESHOLD,
      String(data.monthly_absence_threshold),
    ]);
  }
  if (data.low_marks_threshold_percent !== undefined) {
    settingUpdates.push([
      SETTING_LOW_MARKS_THRESHOLD_PERCENT,
      String(data.low_marks_threshold_percent),
    ]);
  }
  if (data.teacher_name !== undefined) {
    settingUpdates.push([SETTING_TEACHER_NAME, data.teacher_name]);
  }
  if (data.institution_name !== undefined) {
    settingUpdates.push([SETTING_INSTITUTION_NAME, data.institution_name]);
  }
  if (data.report_title !== undefined) {
    settingUpdates.push([SETTING_REPORT_TITLE, data.report_title]);
  }
  if (data.report_footer !== undefined) {
    settingUpdates.push([SETTING_REPORT_FOOTER, data.report_footer]);
  }

  await Promise.all(settingUpdates.map(([key, value]) => setSetting(key, value)));

  return NextResponse.json({ success: true });
}
