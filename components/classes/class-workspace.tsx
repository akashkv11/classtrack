import Link from "next/link";
import RecentSessionsList from "@/components/classes/recent-sessions-list";
import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { ButtonLink } from "@/components/ui/button";
import LinkGrid from "@/components/ui/link-grid";
import SectionCard from "@/components/ui/section-card";
import { StatusBadgeFromConfig } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/card";
import SendWhatsAppButton from "@/components/whatsapp/send-whatsapp-button";
import OpenWhatsAppChannelButton from "@/components/whatsapp/open-whatsapp-channel-button";
import type { ClassWorkspaceOverview } from "@/lib/queries/class-overview";
import {
  attendanceMarkedStatus,
  countStatus,
  diaryAddedStatus,
} from "@/lib/ui/status-badges";

type Session = {
  id: string;
  date: string;
};

type ClassWorkspaceProps = {
  classId: string;
  overview: ClassWorkspaceOverview;
  sessions: Session[];
  whatsappChannelUrl: string | null;
};

export default function ClassWorkspace({
  classId,
  overview,
  sessions,
  whatsappChannelUrl,
}: ClassWorkspaceProps) {
  const base = `/classes/${classId}`;

  const academicLinks = [
    { href: `${base}/attendance`, label: "Attendance", description: "Mark and review daily attendance" },
    { href: `${base}/syllabus`, label: "Syllabus", description: "Topics, chapters, and progress" },
    {
      href: `${base}/teaching-diary`,
      label: "Teaching Diary",
      description: "Record what you taught each class",
    },
    {
      href: `${base}/assessments`,
      label: "Assessments",
      description: "Tests, marks, and class averages",
    },
  ];

  const studentLinks = [
    {
      href: `${base}/students`,
      label: "Students",
      description: `${overview.student_count} active students · list, profiles, attendance, and marks`,
    },
  ];

  const followUpLinks = [
    {
      href: `${base}/student-notes`,
      label: "Student Notes",
      description:
        overview.open_student_notes > 0
          ? `${overview.open_student_notes} open note${overview.open_student_notes === 1 ? "" : "s"}`
          : "Private observations and follow-ups",
    },
    {
      href: `${base}/parent-communication`,
      label: "Parent Communication",
      description:
        overview.open_parent_follow_ups > 0
          ? `${overview.open_parent_follow_ups} follow-up${overview.open_parent_follow_ups === 1 ? "" : "s"} pending`
          : "Contact history and parent messages",
    },
    {
      href: `${base}/attendance-alerts`,
      label: "Attendance Alerts",
      description:
        overview.open_alerts_count > 0
          ? `${overview.open_alerts_count} open alert${overview.open_alerts_count === 1 ? "" : "s"}`
          : "Students needing attendance follow-up",
    },
  ];

  const reportLinks = [
    {
      href: `${base}/reports/attendance`,
      label: "Attendance Report",
      description: "Monthly attendance summary",
    },
    {
      href: `${base}/reports/assessments`,
      label: "Assessment Report",
      description: "Class marks and mark sheets",
    },
    {
      href: `${base}/reports/student-profile`,
      label: "Student Profile Report",
      description: "Individual student progress",
    },
    {
      href: `${base}/reports`,
      label: "All Reports",
      description: "Syllabus, diary, and more",
    },
  ];

  return (
    <>
      <SectionCard title="Today" description="Quick status for this class today.">
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadgeFromConfig status={attendanceMarkedStatus(overview.attendance_marked)} />
          <StatusBadgeFromConfig status={diaryAddedStatus(overview.diary_added_today)} />
          <StatusBadgeFromConfig
            status={countStatus(overview.open_alerts_count, "open alert")}
          />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Students"
            value={overview.student_count}
          />
          <StatCard
            label="Syllabus"
            value={
              overview.syllabus_progress_percentage !== null
                ? `${overview.syllabus_progress_percentage}%`
                : "—"
            }
          />
          <StatCard label="Open Notes" value={overview.open_student_notes} />
          <StatCard label="Parent Follow-ups" value={overview.open_parent_follow_ups} />
        </div>

        <ActionBar>
          {overview.attendance_marked && overview.attendance_session_id ? (
            <>
              <ButtonLink
                href={`${base}/summary/${overview.attendance_session_id}`}
                variant="secondary"
                size="sm"
                className={actionButtonClassName}
              >
                View Attendance
              </ButtonLink>
              <SendWhatsAppButton
                sessionId={overview.attendance_session_id}
                className={actionButtonClassName}
              />
            </>
          ) : overview.attendance_marked ? (
            <ButtonLink
              href="/timetable"
              variant="secondary"
              size="sm"
              className={actionButtonClassName}
            >
              View today&apos;s sessions ({overview.attendance_sessions_today})
            </ButtonLink>
          ) : (
            <ButtonLink
              href={`${base}/attendance`}
              variant="primary"
              size="sm"
              className={actionButtonClassName}
            >
              Mark Attendance
            </ButtonLink>
          )}
          <ButtonLink
            href={`${base}/teaching-diary`}
            variant="secondary"
            size="sm"
            className={actionButtonClassName}
          >
            {overview.diary_added_today ? "View Diary" : "Add Diary Entry"}
          </ButtonLink>
          {overview.open_alerts_count > 0 && (
            <ButtonLink
              href={`${base}/attendance-alerts`}
              variant="secondary"
              size="sm"
              className={actionButtonClassName}
            >
              View Alerts
            </ButtonLink>
          )}
          {whatsappChannelUrl && (
            <OpenWhatsAppChannelButton
              channelUrl={whatsappChannelUrl}
              className={actionButtonClassName}
            />
          )}
        </ActionBar>
      </SectionCard>

      <SectionCard title="Academic Work">
        <LinkGrid items={academicLinks} />
      </SectionCard>

      <SectionCard title="Students">
        <LinkGrid items={studentLinks} />
      </SectionCard>

      <SectionCard title="Follow-up">
        <LinkGrid items={followUpLinks} />
      </SectionCard>

      <SectionCard title="Reports">
        <LinkGrid items={reportLinks} />
      </SectionCard>

      <SectionCard title="Recent Attendance" description="Latest marked sessions for this class.">
        <RecentSessionsList classId={classId} sessions={sessions} showTitle={false} />
        {sessions.length > 0 && (
          <p className="mt-3 text-sm">
            <Link
              href={`${base}/reports/attendance`}
              className="font-medium text-blue-700 hover:text-blue-800"
            >
              View full attendance report →
            </Link>
          </p>
        )}
      </SectionCard>

      <div className="text-right">
        <Link
          href={`${base}/settings`}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Class settings →
        </Link>
      </div>
    </>
  );
}
