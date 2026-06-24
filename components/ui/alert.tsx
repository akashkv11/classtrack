const variants = {
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

type AlertProps = {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
};

export default function Alert({ variant = "info", children, className = "" }: AlertProps) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function WarningPanel({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-5 ${className}`}
    >
      <div>
        <h2 className="font-semibold text-amber-950">{title}</h2>
        {description && (
          <div className="mt-1 text-sm text-amber-900">{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}
