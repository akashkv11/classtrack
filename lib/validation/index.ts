export * from "./primitives";
export * from "./schemas";
export * from "./syllabus-schemas";
export * from "./teaching-diary-schemas";
export * from "./reports-schemas";
export * from "./assessment-schemas";
export * from "./student-note-schemas";
export * from "./parent-communication-schemas";
export * from "./parse";

// QUESTION: Why is this here?
// NOTE: This utility function generates a standard set of Tailwind CSS classes for form inputs,
// highlighting them with a red border if 'hasError' is true. Since this file is about validation utilities,
// its presence makes sense if form rendering helpers are considered part of validation UX,
// but consider moving it if you want clearer separation of concerns (validation logic vs UI rendering).
export function inputClassName(hasError?: boolean, className = "w-full") {
  const border = hasError ? "border-red-400" : "border-slate-300";
  return `${className} rounded-lg border ${border} px-3 py-2 outline-none ring-blue-500 focus:ring-2`;
}
