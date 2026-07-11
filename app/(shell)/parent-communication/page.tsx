import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import ParentCommunicationClassCard from "@/components/parent-communication/parent-communication-class-card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getParentCommunicationOverviewForActiveYear } from "@/lib/queries/parent-communications";

export const dynamic = "force-dynamic";

export default async function ParentCommunicationPage() {
  const { activeYear, classes } =
    await getParentCommunicationOverviewForActiveYear();

  const withCommunications = classes.filter((c) => c.communications_count > 0);
  const totalCommunications = classes.reduce(
    (sum, c) => sum + c.communications_count,
    0,
  );
  const openFollowUps = classes.reduce(
    (sum, c) => sum + c.open_follow_ups_count,
    0,
  );

  return (
    <PageContainer>
      <PageHeader
        title="Parent Communication"
        subtitle={
          activeYear
            ? `Academic Year: ${activeYear.name} · Record parent contact and follow-ups`
            : undefined
        }
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : classes.length === 0 ? (
        <p className="text-slate-600">No classes found for this academic year.</p>
      ) : (
        <>
          {withCommunications.length > 0 && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Classes with records</p>
                <p className="text-2xl font-bold text-slate-900">
                  {withCommunications.length}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Total communications</p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalCommunications}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Open follow-ups</p>
                <p className="text-2xl font-bold text-slate-900">{openFollowUps}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((overview) => (
              <ParentCommunicationClassCard
                key={overview.class_id}
                overview={overview}
              />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
