export type ClassNavItem = {
  id: string;
  label: string;
  href: (classId: string) => string;
  match: (path: string, classId: string) => boolean;
};

function classBasePath(classId: string) {
  return `/classes/${classId}`;
}

export const classNavItems: ClassNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: (classId) => classBasePath(classId),
    match: (path, classId) => path === classBasePath(classId),
  },
  {
    id: "attendance",
    label: "Attendance",
    href: (classId) => `${classBasePath(classId)}/attendance`,
    match: (path, classId) =>
      path.startsWith(`${classBasePath(classId)}/attendance`) ||
      path.startsWith(`${classBasePath(classId)}/summary/`),
  },
  {
    id: "syllabus",
    label: "Syllabus",
    href: (classId) => `${classBasePath(classId)}/syllabus`,
    match: (path, classId) => path.startsWith(`${classBasePath(classId)}/syllabus`),
  },
  {
    id: "teaching-diary",
    label: "Diary",
    href: (classId) => `${classBasePath(classId)}/teaching-diary`,
    match: (path, classId) => path.startsWith(`${classBasePath(classId)}/teaching-diary`),
  },
  {
    id: "assessments",
    label: "Assessments",
    href: (classId) => `${classBasePath(classId)}/assessments`,
    match: (path, classId) => {
      const base = classBasePath(classId);
      return (
        path.startsWith(`${base}/assessments`) && !path.startsWith(`${base}/reports/assessments`)
      );
    },
  },
  {
    id: "students",
    label: "Students",
    href: (classId) => `${classBasePath(classId)}/students`,
    match: (path, classId) => path.startsWith(`${classBasePath(classId)}/students`),
  },
  {
    id: "reports",
    label: "Reports",
    href: (classId) => `${classBasePath(classId)}/reports`,
    match: (path, classId) => path.startsWith(`${classBasePath(classId)}/reports`),
  },
  {
    id: "settings",
    label: "Settings",
    href: (classId) => `${classBasePath(classId)}/settings`,
    match: (path, classId) => path.startsWith(`${classBasePath(classId)}/settings`),
  },
];

export function classSubnavClassName(active: boolean) {
  return active
    ? "border-blue-600 bg-blue-50 text-blue-700"
    : "border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900";
}
