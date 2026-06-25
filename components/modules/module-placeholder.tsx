import { notFound } from "next/navigation";
import Card from "@/components/ui/card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getModuleById } from "@/lib/navigation";

type ModulePlaceholderProps = {
  moduleId: string;
};

export default function ModulePlaceholder({ moduleId }: ModulePlaceholderProps) {
  const appModule = getModuleById(moduleId);

  if (!appModule) notFound();

  return (
    <PageContainer>
      <PageHeader title={appModule.label} subtitle={appModule.description} />
      <Card>
        <p className="text-sm text-slate-600">
          The <span className="font-medium text-slate-900">{appModule.label}</span> module is
          set up and ready. Features for this section will be added here soon.
        </p>
      </Card>
    </PageContainer>
  );
}
