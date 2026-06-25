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

export const appModules: AppModule[] = [
  {
    id: "today",
    href: "/today",
    label: "Today",
    description: "Your daily overview — classes, tasks, and what needs attention.",
    match: exactOrChild("/today"),
  },
  {
    id: "classes",
    href: "/classes",
    label: "Classes",
    description: "View and manage your classes, students, and attendance.",
    match: (path) => path === "/classes" || path.startsWith("/classes/"),
  },
  {
    id: "teaching-diary",
    href: "/teaching-diary",
    label: "Teaching Diary",
    description: "Record what you taught in each class session.",
    match: exactOrChild("/teaching-diary"),
  },
  {
    id: "attendance-alerts",
    href: "/attendance-alerts",
    label: "Attendance Alerts",
    description: "Review students with frequent absences and attendance concerns.",
    match: exactOrChild("/attendance-alerts"),
  },
  {
    id: "homework",
    href: "/homework",
    label: "Homework",
    description: "Assign and track homework for your classes.",
    match: exactOrChild("/homework"),
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
    match: exactOrChild("/syllabus-progress"),
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

export const mainNavItems = appModules;

export function getModuleById(id: string): AppModule | undefined {
  return appModules.find((module) => module.id === id);
}

export function navLinkClassName(active: boolean) {
  return active
    ? "bg-blue-50 text-blue-700"
    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900";
}
