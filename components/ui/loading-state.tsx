import Card from "@/components/ui/card";

type EmptyStateProps = {
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, message, action, className = "" }: EmptyStateProps) {
  return (
    <Card padding="lg" className={`text-center ${className}`}>
      {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
      <p className={`text-sm text-slate-600 ${title ? "mt-2" : ""}`}>{message}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}

export default function LoadingState({ message = "Loading..." }: { message?: string }) {
  return <p className="text-slate-600">{message}</p>;
}

// Alias for dashboard/report summary tiles
export { StatCard as SummaryCard } from "@/components/ui/card";
