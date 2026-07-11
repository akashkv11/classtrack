import Card from "@/components/ui/card";
import TimetableScheduleCard from "@/components/timetable/timetable-schedule-card";
import type { DashboardTodayItem } from "@/lib/types/dashboard";

type DashboardTodayScheduleProps = {
  items: DashboardTodayItem[];
  date: string;
};

export default function DashboardTodaySchedule({ items, date }: DashboardTodayScheduleProps) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">
          No classes scheduled for today. Add entries in Timetable to see your daily
          schedule here, or use the class overview below.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <TimetableScheduleCard key={item.entry_id} item={item} date={date} />
      ))}
    </div>
  );
}
