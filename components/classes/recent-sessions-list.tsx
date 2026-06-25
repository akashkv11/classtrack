import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { ButtonLink } from "@/components/ui/button";
import SendWhatsAppButton from "@/components/whatsapp/send-whatsapp-button";

type Session = {
  id: string;
  date: string;
};

type RecentSessionsListProps = {
  classId: string;
  sessions: Session[];
  showTitle?: boolean;
};

export default function RecentSessionsList({
  classId,
  sessions,
  showTitle = true,
}: RecentSessionsListProps) {
  return (
    <section className={showTitle ? "mb-10" : undefined}>
      {showTitle && (
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent Attendance Dates</h2>
      )}
      {sessions.length === 0 ? (
        <p className="text-sm text-slate-600">No attendance recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-slate-900">{session.date}</span>
                <ActionBar className="sm:justify-end">
                  <ButtonLink
                    href={`/classes/${classId}/summary/${session.id}`}
                    variant="secondary"
                    size="sm"
                    className={actionButtonClassName}
                  >
                    View
                  </ButtonLink>
                  <SendWhatsAppButton sessionId={session.id} className={actionButtonClassName} />
                </ActionBar>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
