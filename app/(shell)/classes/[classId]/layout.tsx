import { Suspense } from "react";
import { ClassProvider } from "@/components/classes/class-provider";
import ClassSubnavLoader from "@/components/layout/class-subnav-loader";
import { ClassSubnavFallback } from "@/components/ui/page-loading";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ classId: string }>;
};

export default async function ClassLayout({ children, params }: LayoutProps) {
  const { classId } = await params;

  return (
    <ClassProvider classId={classId}>
      <Suspense fallback={<ClassSubnavFallback />}>
        <ClassSubnavLoader classId={classId} />
      </Suspense>
      {children}
    </ClassProvider>
  );
}
