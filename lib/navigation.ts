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
const classReportsPath = /^\/classes\/[^/]+\/reports(\/|$)/;
const classAssessmentsPath = /^\/classes\/[^/]+\/assessments(\/|$)/;
const classStudentsPath = /^\/classes\/[^/]+\/students(\/|$)/;
const classStudentNotesPath = /^\/classes\/[^/]+\/student-notes(\/|$)/;

function isClassSyllabusPath(path: string) {
  return classSyllabusPath.test(path);
}

function isClassTeachingDiaryPath(path: string) {
  return classTeachingDiaryPath.test(path);
}

function isClassReportsPath(path: string) {
  return classReportsPath.test(path);
}

function isClassAssessmentsPath(path: string) {
  return classAssessmentsPath.test(path);
}

function isClassStudentsPath(path: string) {
  return classStudentsPath.test(path);
}

function isClassStudentNotesPath(path: string) {
  return classStudentNotesPath.test(path);
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
      !isClassTeachingDiaryPath(path) &&
      !isClassReportsPath(path) &&
      !isClassAssessmentsPath(path) &&
      !isClassStudentsPath(path) &&
      !isClassStudentNotesPath(path),
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
    match: (path) =>
      path === "/marks" ||
      path.startsWith("/marks/") ||
      isClassAssessmentsPath(path),
  },
  {
    id: "student-profile",
    href: "/student-profile",
    label: "Student Profile",
    description: "Look up a student’s details, history, and performance.",
    match: (path) =>
      path === "/student-profile" ||
      path.startsWith("/student-profile/") ||
      isClassStudentsPath(path),
  },
  {
    id: "student-notes",
    href: "/student-notes",
    label: "Student Notes",
    description: "Keep private notes and observations about students.",
    match: (path) =>
      path === "/student-notes" ||
      path.startsWith("/student-notes/") ||
      isClassStudentNotesPath(path),
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
    match: (path) =>
      path === "/reports" ||
      path.startsWith("/reports/") ||
      isClassReportsPath(path),
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
  "marks",
  "student-profile",
  "student-notes",
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
