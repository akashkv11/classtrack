export type AppModule = {
  id: string;
  href: string;
  label: string;
  description: string;
  match: (path: string) => boolean;
};

function exactOrChild(href: string) {
  return (path: string) => path === href || path.startsWith(`${href}/`);
}

const classSyllabusPath = /^\/classes\/[^/]+\/syllabus(\/|$)/;
const classTeachingDiaryPath = /^\/classes\/[^/]+\/teaching-diary(\/|$)/;

function isClassSyllabusPath(path: string) {
  return classSyllabusPath.test(path);
}

function isClassTeachingDiaryPath(path: string) {
  return classTeachingDiaryPath.test(path);
}

export const appModules: AppModule[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    description: "Your control center — today's work, classes, and what needs attention.",
    match: exactOrChild("/dashboard"),
  },
  {
    id: "timetable",
    href: "/timetable",
    label: "Timetable",
    description: "Manage your weekly teaching schedule and class periods.",
    match: exactOrChild("/timetable"),
  },
  {
    id: "classes",
    href: "/classes",
    label: "Classes",
    description: "View and manage your classes, students, and attendance.",
    match: (path) =>
      (path === "/classes" || path.startsWith("/classes/")) &&
      !isClassSyllabusPath(path) &&
      !isClassTeachingDiaryPath(path),
  },
  {
    id: "teaching-diary",
    href: "/teaching-diary",
    label: "Teaching Diary",
    description: "Record what you taught in each class session.",
    match: (path) =>
      path === "/teaching-diary" ||
      path.startsWith("/teaching-diary/") ||
      isClassTeachingDiaryPath(path),
  },
  {
    id: "attendance-alerts",
    href: "/attendance-alerts",
    label: "Attendance Alerts",
    description: "Review students with frequent absences and attendance concerns.",
    match: exactOrChild("/attendance-alerts"),
  },
  {
    id: "marks",
    href: "/marks",
    label: "Marks / Assessments",
    description: "Record test scores, assignments, and assessment results.",
    match: exactOrChild("/marks"),
  },
  {
    id: "student-profile",
    href: "/student-profile",
    label: "Student Profile",
    description: "Look up a student’s details, history, and performance.",
    match: exactOrChild("/student-profile"),
  },
  {
    id: "student-notes",
    href: "/student-notes",
    label: "Student Notes",
    description: "Keep private notes and observations about students.",
    match: exactOrChild("/student-notes"),
  },
  {
    id: "parent-communication",
    href: "/parent-communication",
    label: "Parent Communication",
    description: "Message parents and track communication history.",
    match: exactOrChild("/parent-communication"),
  },
  {
    id: "syllabus-progress",
    href: "/syllabus-progress",
    label: "Syllabus Progress",
    description: "Track syllabus coverage across topics and units.",
    match: (path) =>
      path === "/syllabus-progress" ||
      path.startsWith("/syllabus-progress/") ||
      isClassSyllabusPath(path),
  },
  {
    id: "reports",
    href: "/reports",
    label: "Reports",
    description: "View school-wide and class-level reports and analytics.",
    match: exactOrChild("/reports"),
  },
  {
    id: "settings",
    href: "/settings",
    label: "Settings",
    description: "Configure academic years, messaging, and app preferences.",
    match: exactOrChild("/settings"),
  },
];

const primaryNavIds = [
  "dashboard",
  "classes",
  "timetable",
  "teaching-diary",
  "syllabus-progress",
  "reports",
  "settings",
] as const;

export const mainNavItems = primaryNavIds
  .map((id) => appModules.find((module) => module.id === id))
  .filter((module): module is AppModule => module !== undefined);

export function getModuleById(id: string): AppModule | undefined {
  return appModules.find((module) => module.id === id);
}

export function navLinkClassName(active: boolean) {
  return active
    ? "bg-blue-50 text-blue-700"
    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900";
}
