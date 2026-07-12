import PageContainer from "@/components/ui/page-container";

export function PageLoadingSkeleton() {
  return (
    <PageContainer aria-busy="true" aria-label="Loading page">
      <div className="mb-6 animate-pulse">
        <div className="mb-2 h-4 w-28 rounded bg-slate-200" />
        <div className="h-8 w-72 max-w-full rounded bg-slate-200" />
        <div className="mt-2 h-4 w-48 max-w-full rounded bg-slate-100" />
      </div>
      <div className="space-y-4 animate-pulse">
        <div className="h-36 rounded-xl bg-slate-100" />
        <div className="h-36 rounded-xl bg-slate-100" />
        <div className="h-24 rounded-xl bg-slate-100" />
      </div>
    </PageContainer>
  );
}

export function ClassSubnavFallback() {
  return (
    <div
      data-print-hide
      className="sticky top-16 z-20 border-b border-slate-200 bg-white"
      aria-hidden
    >
      <div className="hidden border-b border-slate-100 px-4 py-2 lg:block lg:px-6">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="flex gap-1 overflow-x-auto px-4 py-2 lg:px-6">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="h-8 w-20 shrink-0 animate-pulse rounded-lg bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}
