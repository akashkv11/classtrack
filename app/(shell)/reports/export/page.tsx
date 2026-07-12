import Link from "next/link";
import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import ReportsExportClient from "@/components/reports/reports-export-client";
import ReportsClassCard from "@/components/reports/reports-class-card";
import { REPORT_TYPES } from "@/lib/reports/constants";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import { getActiveClasses } from "@/lib/queries/classes";
import { getReportsOverviewForActiveYear } from "@/lib/queries/reports";

export const dynamic = "force-dynamic";

export default async function ReportsExportPage() {
  const [{ activeYear, classes: overviews }, { classes }] = await Promise.all([
    getReportsOverviewForActiveYear(),
    getActiveClasses(),
  ]);

  const classOptions = classes.map((cls) => ({
    id: cls.id,
    display_name: cls.displayName,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Export Reports"
        subtitle={
          activeYear
            ? `Academic Year: ${activeYear.name} · Preview and print reports`
            : undefined
        }
        backHref="/reports"
        backLabel="← Back to Reports"
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : (
        <>
          <ReportsExportClient classes={classOptions} />

          <SectionCard title="Available Report Types" className="mt-6">
            <ul className="grid gap-3 sm:grid-cols-2">
              {REPORT_TYPES.map((type) => (
                <li
                  key={type.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <p className="font-medium text-slate-900">{type.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{type.description}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          {overviews.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Class Reports</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {overviews.map((overview) => (
                  <ReportsClassCard key={overview.class_id} overview={overview} />
                ))}
              </div>
            </section>
          )}

          <p className="mt-6 text-sm text-slate-600">
            Configure report headers and institution details in{" "}
            <Link href="/settings" className="font-medium text-blue-700 hover:text-blue-800">
              Settings → Reports
            </Link>
            .
          </p>
        </>
      )}
    </PageContainer>
  );
}
