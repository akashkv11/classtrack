export * from "./primitives";
export * from "./schemas";
export * from "./parse";

export function inputClassName(hasError?: boolean, className = "w-full") {
  const border = hasError ? "border-red-400" : "border-slate-300";
  return `${className} rounded-lg border ${border} px-3 py-2 outline-none ring-blue-500 focus:ring-2`;
}
