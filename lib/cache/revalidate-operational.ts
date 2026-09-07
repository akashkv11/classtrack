import { revalidatePath } from "next/cache";

/** Invalidate pages that show live attendance / diary / today status. */
export function revalidateOperationalViews(classId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/timetable");
  revalidatePath("/classes");
  revalidatePath("/teaching-diary");

  if (classId) {
    revalidatePath(`/classes/${classId}`);
    revalidatePath(`/classes/${classId}/attendance`);
    revalidatePath(`/classes/${classId}/teaching-diary`);
  }
}
