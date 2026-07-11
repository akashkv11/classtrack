import SettingsSection from "@/components/settings/settings-section";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/assessments/types";
import type { SettingsData } from "@/lib/types";

type SettingsCommunicationSectionProps = {
  communication: SettingsData["communication"];
};

export default function SettingsCommunicationSection({
  communication,
}: SettingsCommunicationSectionProps) {
  return (
    <SettingsSection
      title="Communication"
      description="Default categories used in Student Notes and Parent Communication."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-800">Parent communication reasons</p>
          <ul className="list-inside list-disc text-sm text-slate-700">
            {communication.parent_reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-800">Student note categories</p>
          <ul className="list-inside list-disc text-sm text-slate-700">
            {communication.note_categories.map((category) => (
              <li key={category}>{category}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-slate-800">Assessment types</p>
        <ul className="list-inside list-disc text-sm text-slate-700">
          {Object.values(ASSESSMENT_TYPE_LABELS).map((type) => (
            <li key={type}>{type}</li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        Custom category lists will be editable in a later update. These defaults are shared
        across the app today.
      </p>
    </SettingsSection>
  );
}
