"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/form-field";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/assessments/types";
import { formatDisplayDate, parseISODate } from "@/lib/dates";
import type { ParentAssessmentInfo, ParentAssessmentResult, ParentAssessmentMatch, ParentAssessmentLookupResponse } from "@/lib/types/assessment";

export default function ParentResults({ token, assessment }: { token: string; assessment: ParentAssessmentInfo }) {
  const [name, setName] = useState("");
  const [matches, setMatches] = useState<ParentAssessmentMatch[]>([]);
  const [result, setResult] = useState<ParentAssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function lookup(rollNo?: number) {
    setLoading(true); setError(""); setResult(null); setMatches([]);
    try {
      const response = await fetch(`/api/results/${token}/lookup`, {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ name, ...(rollNo !== undefined ? { roll_no: rollNo } : {}) }),
      });
      const data = await response.json() as ParentAssessmentLookupResponse & { error?: string };
      if (response.ok && data.status === "matches") { setMatches(data.matches); return; }
      if (data.status === "unavailable") throw new Error("This results link is unavailable. Please contact the student’s teacher.");
      if (data.status === "not_found") throw new Error("No saved result matches these details. Check the student’s name, try a different part of the name, or contact the teacher.");
      if (!response.ok || data.status !== "found") throw new Error(data.error ?? "Results could not be loaded. Please try again.");
      setResult(data.result);
    } catch (error) {
      setError(error instanceof TypeError ? "Unable to connect. Check your connection and try again." : error instanceof Error ? error.message : "Results could not be loaded. Please try again.");
    } finally { setLoading(false); }
  }
  const info = result?.assessment ?? assessment;
  return <>
    <h1 className="text-2xl font-bold text-slate-900">{info.name}</h1>
    <p className="mt-2 text-sm text-slate-600">{info.class_name} · {info.subject}</p>
    <form onSubmit={event => { event.preventDefault(); void lookup(); }} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div><label htmlFor="student-name" className="mb-1 block text-sm font-medium text-slate-700">Enter student’s name</label>
        <TextInput id="student-name" required minLength={2} maxLength={200} autoComplete="off" value={name} disabled={loading} onChange={event => { setName(event.target.value); setResult(null); setMatches([]); setError(""); }} />
        <p className="mt-1 text-xs text-slate-500">Enter a first name or part of the name.</p>
      </div>
      {error && <div role="alert"><Alert variant="error">{error}</Alert></div>}
      <Button type="submit" disabled={loading || name.trim().length < 2} className="w-full">{loading ? "Checking…" : "View result"}</Button>
    </form>
    {matches.length > 0 && <section aria-label="Matching students" aria-live="polite" className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">Select the student</h2>
      <p className="mt-1 text-sm text-slate-600">More than one student matches. Choose the correct name and roll number.</p>
      <ul className="mt-4 space-y-2">
        {matches.map(match => <li key={match.roll_no}>
          <button type="button" disabled={loading} onClick={() => lookup(match.roll_no)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-300 p-3 text-left hover:border-blue-500 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">
            <span className="min-w-0 break-words font-medium text-slate-900">{match.full_name}</span>
            <span className="shrink-0 text-sm text-slate-600">Roll {match.roll_no}</span>
          </button>
        </li>)}
      </ul>
    </section>}
    {result && <section aria-label="Student’s result" aria-live="polite" className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-semibold text-slate-900">{result.student_name}</h2>
      <p className="mt-1 text-sm text-slate-600">Roll {result.roll_no} · {info.class_name}</p>
      <div className="my-5 rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-slate-600">Result</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{result.marks_obtained === null ? "Absent" : `${result.marks_obtained} / ${info.max_marks}`}</p>
        {result.percentage !== null && <p className="mt-1 text-sm text-blue-700">{result.percentage}%</p>}
      </div>
      <dl className="space-y-3 text-sm">
        {[["Assessment", info.name], ["Type", ASSESSMENT_TYPE_LABELS[info.assessment_type]], ["Date", formatDisplayDate(parseISODate(info.assessment_date))], ["Subject", info.subject], ["Chapter", info.chapter], ["Topics", info.topics.join(", ")], ["Maximum marks", String(info.max_marks)], ["Remarks", result.remarks]].map(([label, value]) => value ? <div key={label}><dt className="font-medium text-slate-700">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-slate-600">{value}</dd></div> : null)}
      </dl>
    </section>}
  </>;
}
