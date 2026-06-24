import { notFound } from "next/navigation";
import { ClassProvider } from "@/components/classes/class-provider";
import { getClassById } from "@/lib/queries/classes";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ classId: string }>;
};

export default async function ClassLayout({ children, params }: LayoutProps) {
  const { classId } = await params;
  const cls = await getClassById(classId);

  if (!cls) notFound();

  return (
    <ClassProvider
      value={{
        classId,
        displayName: cls.displayName,
        whatsappNumber: cls.whatsappNumber,
      }}
    >
      {children}
    </ClassProvider>
  );
}
