import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import { EmptyState } from "@/components/ui/loading-state";
import Table, { TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import MarkPreparationButton from "@/components/preparation/mark-preparation-button";
import { PREPARATION_LABELS, type StudentPreparationHistoryEntry } from "@/lib/preparation";
import { formatDisplayDate, parseISODate } from "@/lib/dates";

export default function StudentPreparationSection({ classId, entries }: {
  classId: string;
  entries: StudentPreparationHistoryEntry[];
}) {
  return (
    <section id="student-preparation" className="mt-8">
      <Card className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900">Preparation Notes</h3>
        <p className="mb-4 mt-1 text-sm text-slate-600">Notes are recorded automatically when the student is marked not prepared or partially prepared.</p>
        {entries.length === 0 ? (
          <EmptyState message="No preparation concerns or notes recorded for this student yet." />
        ) : (
          <Table>
            <TableHead><TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell>Preparation</TableHeaderCell>
              <TableHeaderCell>Note</TableHeaderCell>
              <TableHeaderCell><span className="sr-only">Actions</span></TableHeaderCell>
            </TableRow></TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDisplayDate(parseISODate(entry.date))}</TableCell>
                  <TableCell>{entry.subject ?? "Class session"}</TableCell>
                  <TableCell>
                    <Badge variant={entry.status === "NONE" ? "warning" : entry.status === "PARTIAL" ? "info" : entry.status === "FULL" ? "success" : "neutral"}>
                      {PREPARATION_LABELS[entry.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-40 whitespace-pre-wrap break-words">
                      {entry.automatic_note && <p>{entry.automatic_note}</p>}
                      {entry.note && <p className={entry.automatic_note ? "mt-2 text-slate-600" : undefined}>{entry.note}</p>}
                      {!entry.automatic_note && !entry.note && "No preparation note."}
                    </div>
                  </TableCell>
                  <TableCell>
                    <MarkPreparationButton classId={classId} date={entry.date} timetableEntryId={entry.timetable_entry_id} title={entry.subject ?? "Class session"} label="Edit Preparation" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </section>
  );
}
