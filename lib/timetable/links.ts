export type TimetableLinkParams = {
  date?: string;
  timetableEntryId?: string;
  subject?: string;
  startTime?: string;
  endTime?: string;
  openForm?: boolean;
};

function buildQuery(params: TimetableLinkParams): string {
  const search = new URLSearchParams();
  if (params.date) search.set("date", params.date);
  if (params.timetableEntryId) search.set("timetable_entry_id", params.timetableEntryId);
  if (params.subject) search.set("subject", params.subject);
  if (params.startTime) search.set("start_time", params.startTime);
  if (params.endTime) search.set("end_time", params.endTime);
  if (params.openForm) search.set("open_form", "1");
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function buildAttendanceLink(
  classId: string,
  params: TimetableLinkParams = {},
): string {
  return `/classes/${classId}/attendance${buildQuery(params)}`;
}

export function buildTeachingDiaryLink(
  classId: string,
  params: TimetableLinkParams = {},
): string {
  return `/classes/${classId}/teaching-diary${buildQuery({ ...params, openForm: true })}`;
}

export function normalizeSubjectName(name: string): string {
  return name.trim().toLowerCase();
}

export function subjectNamesMatch(a: string, b: string): boolean {
  return normalizeSubjectName(a) === normalizeSubjectName(b);
}

export function matchSyllabusSubjectIdByName(
  subjects: { id: string; subject_name: string }[],
  timetableSubject: string,
): string | null {
  const match = subjects.find((subject) =>
    subjectNamesMatch(subject.subject_name, timetableSubject),
  );
  return match?.id ?? null;
}
