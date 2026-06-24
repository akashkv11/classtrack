type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
};

const paddingClasses = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
} as const;

export default function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: React.ReactNode;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card padding="sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}
