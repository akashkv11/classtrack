"use client";

import FormField, { SelectInput } from "@/components/ui/form-field";
import type { SyllabusSubjectSummary } from "@/lib/types/syllabus";

type ReportSubjectFilterProps = {
  subjects: SyllabusSubjectSummary[];
  value: string;
  onChange: (subjectId: string) => void;
};

export default function ReportSubjectFilter({
  subjects,
  value,
  onChange,
}: ReportSubjectFilterProps) {
  if (subjects.length === 0) return null;

  return (
    <FormField label="Subject">
      <SelectInput value={value} onChange={(e) => onChange(e.target.value)}>
        {subjects.length > 1 && <option value="">All subjects</option>}
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.subject_name}
          </option>
        ))}
      </SelectInput>
    </FormField>
  );
}
