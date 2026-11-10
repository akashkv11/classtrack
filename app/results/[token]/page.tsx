import type { Metadata } from "next";
import ParentResults from "@/components/assessments/parent-results";
import { getParentAssessment } from "@/lib/assessments/sharing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Assessment Results · ClassTrack", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ParentResultsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let assessment;
  try {
    assessment = await getParentAssessment(token);
  } catch {
    return <main className="mx-auto w-full max-w-lg px-4 py-10"><h1 className="text-xl font-bold">Results temporarily unavailable</h1><p className="mt-3 text-slate-600">Please refresh this page and try again shortly.</p></main>;
  }
  return <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
    <p className="mb-6 text-sm font-semibold text-blue-700">ClassTrack</p>
    {assessment ? <ParentResults token={token} assessment={assessment} /> : <section>
      <h1 className="text-xl font-bold text-slate-900">Results unavailable</h1>
      <p className="mt-3 text-sm text-slate-600">This link is unavailable. Please contact your child’s teacher for the current results link.</p>
    </section>}
  </main>;
}
