"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import Card from "@/components/ui/card";
import Alert from "@/components/ui/alert";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { TextInput } from "@/components/ui/form-field";
import type { AssessmentSharingState } from "@/lib/types/assessment";

type Props = { assessmentId: string; classId: string; sharing: AssessmentSharingState; onChange: (sharing: AssessmentSharingState) => void };
export default function AssessmentSharingControls({ assessmentId, classId, sharing, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [origin, setOrigin] = useState("");
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  async function change(action: "enable" | "disable" | "regenerate") {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/sharing?class_id=${classId}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update the parent link.");
      onChange(data.sharing);
      setConfirmRegenerate(false);
      setNotice(action === "disable" ? "Parent link disabled." : action === "regenerate" ? "New link generated. The old link no longer works." : "Parent link enabled.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not update the parent link."); }
    finally { setBusy(false); }
  }
  async function copyLink() {
    if (!sharing.path) return;
    setOrigin(window.location.origin); setError(""); setNotice("");
    try { await navigator.clipboard.writeText(window.location.origin + sharing.path); setNotice("Link copied."); }
    catch { setError("Could not copy automatically. Select and copy the link below."); }
  }
  return <Card className="mb-6">
    <h3 className="font-semibold text-slate-900">Parent results link</h3>
    <p className="mt-1 text-sm text-slate-600">{!sharing.path ? "A link is generated when you save marks." : sharing.enabled ? "Parents can enter the student’s full name to view this assessment’s saved result." : "This link is disabled. Parents cannot view results."}</p>
    {sharing.path && <div className="mt-3"><label htmlFor="parent-results-link" className="sr-only">Parent results link</label><TextInput id="parent-results-link" readOnly value={origin + sharing.path} onFocus={event => { setOrigin(window.location.origin); event.target.select(); }} /></div>}
    <div className="mt-3 flex flex-wrap gap-2">
      {sharing.path && sharing.enabled && <><Button type="button" size="sm" disabled={busy} onClick={copyLink}>Copy Link</Button><ButtonLink size="sm" href={sharing.path} target="_blank" rel="noreferrer">Open Link</ButtonLink></>}
      {sharing.path ? <>
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => change(sharing.enabled ? "disable" : "enable")}>{sharing.enabled ? "Disable Link" : "Enable Link"}</Button>
        <Button type="button" variant="secondary" size="sm" disabled={busy || !sharing.has_saved_marks} onClick={() => { setError(""); setConfirmRegenerate(true); }}>Regenerate Link</Button>
      </> : sharing.has_saved_marks && <Button type="button" size="sm" disabled={busy} onClick={() => change("enable")}>Generate Link</Button>}
    </div>
    {error && <div className="mt-3" role="alert"><Alert variant="error">{error}</Alert></div>}
    {notice && <p role="status" className="mt-3 text-sm text-green-700">{notice}</p>}
    <ConfirmDialog open={confirmRegenerate} title="Replace parent results link?" description="The existing link will stop working. Share the new link with parents." confirmLabel="Regenerate Link" loading={busy} onConfirm={() => change("regenerate")} onCancel={() => { if (!busy) setConfirmRegenerate(false); }} />
  </Card>;
}
