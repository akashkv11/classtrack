export const REPORT_TYPES = [
  {
    id: "attendance",
    label: "Monthly Attendance Report",
    description: "Student attendance summary for a selected month.",
    path: (classId: string) => `/classes/${classId}/reports/attendance`,
  },
  {
    id: "syllabus-progress",
    label: "Syllabus Progress Report",
    description: "Topic completion and chapter-wise syllabus progress.",
    path: (classId: string) => `/classes/${classId}/reports/syllabus-progress`,
  },
  {
    id: "teaching-diary",
    label: "Teaching Diary Report",
    description: "Daily teaching records with topics and plans.",
    path: (classId: string) => `/classes/${classId}/reports/teaching-diary`,
  },
  {
    id: "academic-work",
    label: "Monthly Academic Work Report",
    description: "Combined teaching activity and pending topics.",
    path: (classId: string) => `/classes/${classId}/reports/academic-work`,
  },
  {
    id: "assessments",
    label: "Assessment / Marks Report",
    description: "Class assessments with averages and mark sheets.",
    path: (classId: string) => `/classes/${classId}/reports/assessments`,
  },
  {
    id: "student-profile",
    label: "Student Profile Report",
    description: "Individual student attendance and marks overview.",
    path: (classId: string) => `/classes/${classId}/reports/student-profile`,
  },
] as const;

export type ReportTypeId = (typeof REPORT_TYPES)[number]["id"];

export function getReportTypeById(id: string) {
  return REPORT_TYPES.find((type) => type.id === id);
}
