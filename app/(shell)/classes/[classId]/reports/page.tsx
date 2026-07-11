import { notFound } from "next/navigation";
import ReportHubCard from "@/components/reports/report-hub-card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

const reports = [
  {
    slug: "attendance",
    title: "Attendance Report",
    description: "Monthly student attendance summary with present, absent, and late counts.",
  },
  {
    slug: "syllabus-progress",
    title: "Syllabus Progress Report",
    description: "Topic completion status and chapter-wise syllabus progress.",
  },
  {
    slug: "teaching-diary",
    title: "Teaching Diary Report",
    description: "Daily teaching records with topics taught, notes, and next class plans.",
  },
  {
    slug: "academic-work",
    title: "Monthly Academic Work Report",
    description: "Combined monthly view of teaching activity and pending continuation topics.",
  },
] as const;

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
        {reports.map((report) => (
          <ReportHubCard
            key={report.slug}
            href={`/classes/${classId}/reports/${report.slug}`}
            title={report.title}
            description={report.description}
          />
        ))}
      </div>
    </PageContainer>
  );
}
