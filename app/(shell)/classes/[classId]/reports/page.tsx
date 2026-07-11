import { notFound } from "next/navigation";
import ReportHubCard from "@/components/reports/report-hub-card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { REPORT_TYPES } from "@/lib/reports/constants";
import { getClassById } from "@/lib/queries/classes";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

export default async function ClassReportsPage({ params }: PageProps) {
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        subtitle={cls.displayName}
        backHref={`/classes/${classId}`}
        backLabel="← Back to Class"
      />

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Available Reports
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORT_TYPES.map((report) => (
          <ReportHubCard
            key={report.id}
            href={report.path(classId)}
            title={report.label}
            description={report.description}
          />
        ))}
      </div>
    </PageContainer>
  );
}
