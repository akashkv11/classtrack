import { ButtonLink } from "@/components/ui/button";

type ClassActionsProps = {
  classId: string;
};

export default function ClassActions({ classId }: ClassActionsProps) {
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      <ButtonLink href={`/classes/${classId}/attendance`} variant="primary">
        Mark Today&apos;s Attendance
      </ButtonLink>
      <ButtonLink href={`/classes/${classId}/reports`} variant="secondary">
        View Monthly Report
      </ButtonLink>
      <ButtonLink href={`/classes/${classId}/settings`} variant="secondary">
        Class Settings
      </ButtonLink>
    </div>
  );
}
