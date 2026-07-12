import { appModules } from "@/lib/navigation";

const classSegmentTitles: Record<string, string> = {
  attendance: "Attendance",
  syllabus: "Syllabus",
  "teaching-diary": "Teaching Diary",
  assessments: "Assessments",
  students: "Students",
  reports: "Reports",
  settings: "Class Settings",
  "student-notes": "Student Notes",
  "parent-communication": "Parent Communication",
  "attendance-alerts": "Attendance Alerts",
  summary: "Attendance Summary",
};

export function getPageTitleFromPath(pathname: string): string | null {
  const classMatch = pathname.match(/^\/classes\/([^/]+)(?:\/(.*))?$/);
  if (classMatch) {
    const rest = classMatch[2];
    if (!rest) return "Class Overview";
    const segment = rest.split("/")[0];
    return classSegmentTitles[segment] ?? "Class";
  }

  const matchedModule = appModules.find((item) => item.match(pathname));
  return matchedModule?.label ?? null;
}
