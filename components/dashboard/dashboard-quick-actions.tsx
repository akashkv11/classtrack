import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { ButtonLink } from "@/components/ui/button";
import SectionCard from "@/components/ui/section-card";

export default function DashboardQuickActions() {
  return (
    <SectionCard
      title="Quick Actions"
      description="Shortcuts to common tasks and module hubs."
    >
      <ActionBar>
        <ButtonLink href="/classes" variant="primary" size="sm" className={actionButtonClassName}>
          All Classes
        </ButtonLink>
        <ButtonLink
          href="/timetable"
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          Timetable
        </ButtonLink>
        <ButtonLink
          href="/attendance-alerts"
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          Attendance Alerts
        </ButtonLink>
        <ButtonLink
          href="/teaching-diary"
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          Teaching Diary
        </ButtonLink>
        <ButtonLink
          href="/marks"
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          Assessments
        </ButtonLink>
        <ButtonLink
          href="/student-profile"
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          Student Profile
        </ButtonLink>
        <ButtonLink
          href="/student-notes"
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          Student Notes
        </ButtonLink>
        <ButtonLink
          href="/parent-communication"
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          Parent Communication
        </ButtonLink>
        <ButtonLink
          href="/syllabus-progress"
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          Syllabus Progress
        </ButtonLink>
      </ActionBar>
    </SectionCard>
  );
}
