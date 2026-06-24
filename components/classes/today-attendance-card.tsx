import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { ButtonLink } from "@/components/ui/button";
import Card from "@/components/ui/card";
import SendWhatsAppButton from "@/components/whatsapp/send-whatsapp-button";

type TodayAttendanceCardProps = {
  classId: string;
  marked: boolean;
  sessionId?: string;
};

export default function TodayAttendanceCard({
  classId,
  marked,
  sessionId,
}: TodayAttendanceCardProps) {
  return (
    <Card className="mb-8 mt-6">
      <p className="text-sm text-slate-600">Today&apos;s attendance</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">
        {marked ? "Marked" : "Not marked yet"}
      </p>
      {marked && sessionId && (
        <ActionBar className="mt-4">
          <ButtonLink
            href={`/classes/${classId}/summary/${sessionId}`}
            variant="secondary"
            size="sm"
            className={actionButtonClassName}
          >
            View Attendance
          </ButtonLink>
          <SendWhatsAppButton sessionId={sessionId} className={actionButtonClassName} />
        </ActionBar>
      )}
    </Card>
  );
}
