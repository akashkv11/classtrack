import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { ButtonLink } from "@/components/ui/button";

type ClassActionsProps = {
  classId: string;
};

export default function ClassActions({ classId }: ClassActionsProps) {
  return (
    <ActionBar className="mb-8">
      <ButtonLink
        href={`/classes/${classId}/attendance`}
        variant="primary"
        className={actionButtonClassName}
      >
        Mark Today&apos;s Attendance
      </ButtonLink>
      <ButtonLink
        href={`/classes/${classId}/reports`}
        variant="secondary"
        className={actionButtonClassName}
      >
        View Monthly Report
      </ButtonLink>
      <ButtonLink
        href={`/classes/${classId}/settings`}
        variant="secondary"
        className={actionButtonClassName}
      >
        Class Settings
      </ButtonLink>
    </ActionBar>
  );
}
