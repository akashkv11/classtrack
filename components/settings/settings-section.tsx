import Card from "@/components/ui/card";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export default function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <Card padding="lg">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {children}
    </Card>
  );
}
