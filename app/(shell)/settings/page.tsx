import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import SettingsPageClient from "@/components/settings/settings-page-client";

export default function SettingsPage() {
  return (
    <PageContainer size="md">
      <PageHeader
        title="Settings"
        subtitle="Manage academic year, alert thresholds, reports, and shared app defaults."
      />
      <SettingsPageClient />
    </PageContainer>
  );
}
