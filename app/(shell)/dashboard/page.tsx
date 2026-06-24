import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import { StatCard } from "@/components/ui/card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { prisma } from "@/lib/db";
import { getActiveAcademicYear } from "@/lib/queries/classes";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const activeYear = await getActiveAcademicYear();
  const classCount = activeYear
    ? await prisma.class.count({
        where: { academicYearId: activeYear.id, isActive: true },
      })
    : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Home"
        subtitle="Mark attendance, track reports, and notify parents instantly."
      />

      {activeYear ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Active academic year" value={activeYear.name} />
          <StatCard label="Active classes" value={classCount} />
        </div>
      ) : (
        <NoAcademicYearAlert />
      )}
    </PageContainer>
  );
}
