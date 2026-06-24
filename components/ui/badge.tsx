const variants = {
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-blue-100 text-blue-800",
} as const;

type BadgeProps = {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
};

export default function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
