import { prisma } from "@/lib/db";

export async function createStudentWithAssignedNumbers(classId: string, data: {
  fullName: string;
  email: string | null;
  parentPhone: string | null;
  isActive?: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    // Serialize roll and admission allocation per class, including simultaneous first students.
    const classes = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM classes WHERE id = ${classId}::uuid FOR UPDATE
    `;
    if (classes.length === 0) return null;

    // Read after acquiring the lock so a waiting request sees the previous committed number.
    const [numbers] = await tx.$queryRaw<{ next_number: string; next_roll_no: number }[]>`
      SELECT (COALESCE(MAX(CASE WHEN admission_no ~ '^[0-9]+$'
        THEN admission_no::numeric END), 0) + 1)::text AS next_number,
        COALESCE(MAX(roll_no), 0) + 1 AS next_roll_no
      FROM students WHERE class_id = ${classId}::uuid
    `;
    return tx.student.create({
      data: { ...data, classId, admissionNo: numbers.next_number, rollNo: numbers.next_roll_no },
    });
  });
}
