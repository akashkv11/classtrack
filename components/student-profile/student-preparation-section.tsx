"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField, { SelectInput, TextInput } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/loading-state";
import Table, { TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import MarkPreparationButton from "@/components/preparation/mark-preparation-button";
import { PREPARATION_LABELS, type PreparationStatus, type StudentPreparationHistoryEntry } from "@/lib/preparation";
import { formatDisplayDate, parseISODate } from "@/lib/dates";

export default function StudentPreparationSection({ classId, entries }: {
  classId: string;
  entries: StudentPreparationHistoryEntry[];
}) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [preparation, setPreparation] = useState<"all" | PreparationStatus>("all");
  const invalidDateRange = !!fromDate && !!toDate && fromDate > toDate;
  const hasFilters = !!fromDate || !!toDate || preparation !== "all";
  const filteredEntries = entries.filter((entry) =>
    !invalidDateRange &&
    (!fromDate || entry.date >= fromDate) &&
    (!toDate || entry.date <= toDate) &&
    (preparation === "all" || entry.status === preparation),
  );

  return (
    <section id="student-preparation" className="mt-8">
      <Card className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900">Preparation Notes</h3>
        <p className="mb-4 mt-1 text-sm text-slate-600">Notes are recorded automatically when the student is marked not prepared or partially prepared.</p>
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-3 text-sm font-medium text-slate-800">Filter preparation notes</p>
          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="From Date">
              <TextInput type="date" aria-label="Preparation from date" className="w-full"
                value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} />
            </FormField>
            <FormField label="To Date">
              <TextInput type="date" aria-label="Preparation to date" className="w-full"
                value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />
            </FormField>
            <FormField label="Preparation">
              <SelectInput aria-label="Preparation status" className="w-full" value={preparation}
                onChange={(e) => setPreparation(e.target.value as typeof preparation)}>
                <option value="all">All preparation levels</option>
                <option value="NONE">Not prepared</option>
                <option value="PARTIAL">Partially prepared</option>
                <option value="FULL">Fully prepared</option>
                <option value="NOT_MARKED">Not marked</option>
              </SelectInput>
            </FormField>
            <Button type="button" variant="secondary" disabled={!hasFilters} onClick={() => {
              setFromDate(""); setToDate(""); setPreparation("all");
            }}>Clear Filters</Button>
          </div>
        </div>
        {invalidDateRange && <Alert variant="error" className="mb-3">From Date must be on or before To Date.</Alert>}
        <p className="mb-3 text-sm text-slate-600" role="status">Showing {filteredEntries.length} of {entries.length} notes</p>
        {entries.length === 0 ? (
          <EmptyState message="No preparation concerns or notes recorded for this student yet." />
        ) : filteredEntries.length === 0 ? (
          <EmptyState message={invalidDateRange ? "Choose a valid date range to view preparation notes." : "No preparation notes match these filters."} />
        ) : (
          <Table
            key={`${fromDate}-${toDate}-${preparation}`}
            className="max-h-[min(26rem,60vh)] overflow-y-auto overscroll-contain [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10"
            role="region"
            aria-label="Student preparation notes"
            tabIndex={0}
          >
            <TableHead><TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell>Preparation</TableHeaderCell>
              <TableHeaderCell>Note</TableHeaderCell>
              <TableHeaderCell><span className="sr-only">Actions</span></TableHeaderCell>
            </TableRow></TableHead>
            <TableBody>
              {filteredEntries.map((entry) => (
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
