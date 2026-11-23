"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import Card from "@/components/ui/card";
import Alert from "@/components/ui/alert";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { TextInput } from "@/components/ui/form-field";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { AssessmentSharingState } from "@/lib/types/assessment";

type Props = {
  assessmentId: string;
  classId: string;
  className: string;
  assessmentName: string;
  whatsappNumber: string | null;
  sharing: AssessmentSharingState;
  onChange: (sharing: AssessmentSharingState) => void;
};
export default function AssessmentSharingControls({
  assessmentId,
  classId,
  className,
  assessmentName,
  whatsappNumber,
  sharing,
  onChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [origin, setOrigin] = useState("");
  const [preparedLink, setPreparedLink] = useState<{
    path: string;
    url: string;
  } | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<{
    path: string;
    url: string;
  } | null>(null);
  const [warning, setWarning] = useState("");
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const hasWhatsAppNumber = Boolean(whatsappNumber?.trim());
  const displayedLink =
    preparedLink?.path === sharing.path
      ? preparedLink.url
      : origin + sharing.path;
  async function prepareShareUrl() {
    setOrigin(window.location.origin);
    setError("");
    setNotice("");
    setWarning("");
    setWhatsappLink(null);
    const response = await fetch(
      `/api/assessments/${assessmentId}/share-url?class_id=${classId}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(12000),
      },
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.error ?? "Could not prepare the results link. Please try again.",
      );
    if (data.path !== sharing.path || typeof data.url !== "string")
      throw new Error("The parent link changed. Please refresh and try again.");
    setPreparedLink({ path: data.path, url: data.url });
    setWarning(data.warning ?? "");
    return data.url as string;
  }
  async function shareOnWhatsApp() {
    if (busy || !sharing.path || !sharing.enabled || !whatsappNumber?.trim())
      return;
    // Reserve the tab during the click so the asynchronous API call does not trigger popup blocking.
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    setBusy(true);
    try {
      const parentUrl = await prepareShareUrl();
      const message = `${className} — ${assessmentName} Results\n\nEnter the student’s name to view marks:\n${parentUrl}`;
      const url = buildWhatsAppUrl(whatsappNumber, message);
      if (popup && !popup.closed) popup.location.replace(url);
      else {
        setWhatsappLink({ path: sharing.path, url });
        setError(
          "WhatsApp could not open automatically. Use Open WhatsApp below.",
        );
      }
    } catch (error) {
      popup?.close();
      setError(
        error instanceof Error
          ? error.message
          : "Could not prepare the WhatsApp message.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function change(action: "enable" | "disable" | "regenerate") {
    setBusy(true);
    setError("");
    setNotice("");
    setWarning("");
    setWhatsappLink(null);
    try {
      const response = await fetch(
        `/api/assessments/${assessmentId}/sharing?class_id=${classId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Could not update the parent link.");
      onChange(data.sharing);
      setConfirmRegenerate(false);
      setNotice(
        action === "disable"
          ? "Parent link disabled."
          : action === "regenerate"
            ? "New link generated. The old link no longer works."
            : "Parent link enabled.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not update the parent link.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function copyLink() {
    if (busy || !sharing.path || !sharing.enabled) return;
    setBusy(true);
    try {
      const url = await prepareShareUrl();
      try {
        await navigator.clipboard.writeText(url);
        setNotice("Link copied.");
      } catch {
        setError(
          "Could not copy automatically. Select and copy the link below.",
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not prepare the results link.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="mb-6">
      <h3 className="font-semibold text-slate-900">Parent results link</h3>
      <p className="mt-1 text-sm text-slate-600">
        {!sharing.path
          ? "A link is generated when you save marks."
          : sharing.enabled
            ? "Parents can search by student name to view this assessment’s saved result."
            : "This link is disabled. Parents cannot view results."}
      </p>
      {sharing.path && (
        <div className="mt-3">
          <label htmlFor="parent-results-link" className="sr-only">
            Parent results link
          </label>
          <TextInput
            id="parent-results-link"
            readOnly
            value={displayedLink}
            onFocus={(event) => {
              setOrigin(window.location.origin);
              event.target.select();
            }}
          />
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {sharing.path && sharing.enabled && (
          <>
            <Button type="button" size="sm" disabled={busy} onClick={copyLink}>
              Copy Link
            </Button>
            {hasWhatsAppNumber && (
              <Button
                type="button"
                variant="whatsapp"
                size="sm"
                disabled={busy}
                onClick={shareOnWhatsApp}
              >
                Share on WhatsApp
              </Button>
            )}
            <ButtonLink
              size="sm"
              href={sharing.path}
              target="_blank"
              rel="noreferrer"
            >
              Open Link
            </ButtonLink>
          </>
        )}
        {sharing.path ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => change(sharing.enabled ? "disable" : "enable")}
            >
              {sharing.enabled ? "Disable Link" : "Enable Link"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy || !sharing.has_saved_marks}
              onClick={() => {
                setError("");
                setConfirmRegenerate(true);
              }}
            >
              Regenerate Link
            </Button>
          </>
        ) : (
          sharing.has_saved_marks && (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => change("enable")}
            >
              Generate Link
            </Button>
          )
        )}
      </div>
      {busy && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          Preparing link…
        </p>
      )}
      {whatsappLink?.path === sharing.path && sharing.enabled && (
        <div className="mt-3">
          <ButtonLink
            variant="whatsapp"
            size="sm"
            href={whatsappLink.url}
            target="_blank"
            rel="noreferrer"
          >
            Open WhatsApp
          </ButtonLink>
        </div>
      )}
      {sharing.path && sharing.enabled && !hasWhatsAppNumber && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <p>Add a class WhatsApp number to share the parent results link.</p>
          <ButtonLink size="sm" href={`/classes/${classId}/settings`}>
            Class Settings
          </ButtonLink>
        </div>
      )}
      {error && (
        <div className="mt-3" role="alert">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {warning && (
        <div className="mt-3" role="status">
          <Alert variant="warning">{warning}</Alert>
        </div>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {notice}
        </p>
      )}
      <ConfirmDialog
        open={confirmRegenerate}
        title="Replace parent results link?"
        description="The existing link will stop working. Share the new link with parents."
        confirmLabel="Regenerate Link"
        loading={busy}
        onConfirm={() => change("regenerate")}
        onCancel={() => {
          if (!busy) setConfirmRegenerate(false);
        }}
      />
    </Card>
  );
}
