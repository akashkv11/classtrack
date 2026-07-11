import Card from "@/components/ui/card";

type SectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export default function SectionCard({
  title,
  description,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <Card className={`mb-6 ${className}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}
