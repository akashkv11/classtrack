import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ classId: string }> };

export default async function StudentsPage({ params }: PageProps) {
  const { classId } = await params;
  redirect(`/classes/${classId}#students`);
}
