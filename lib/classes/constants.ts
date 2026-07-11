export const CLASS_LEVELS = [
  { value: "plus_one", label: "Plus One" },
  { value: "plus_two", label: "Plus Two" },
] as const;

export const CLASS_STREAMS = [
  { value: "science", label: "Science" },
  { value: "commerce", label: "Commerce" },
  { value: "humanities", label: "Humanities" },
] as const;

export type ClassLevel = (typeof CLASS_LEVELS)[number]["value"];
export type ClassStream = (typeof CLASS_STREAMS)[number]["value"];

const LEVEL_LABELS = Object.fromEntries(
  CLASS_LEVELS.map((l) => [l.value, l.label]),
) as Record<ClassLevel, string>;

const STREAM_LABELS = Object.fromEntries(
  CLASS_STREAMS.map((s) => [s.value, s.label]),
) as Record<ClassStream, string>;

export function buildClassDisplayName(level: ClassLevel, stream: ClassStream): string {
  return `${LEVEL_LABELS[level]} ${STREAM_LABELS[stream]}`;
}
