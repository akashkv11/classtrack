"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import FormField, { TextInput } from "@/components/ui/form-field";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import { inputClassName } from "@/lib/validation";
import { optionalWhatsAppSchema } from "@/lib/validation/primitives";
import { buildWhatsAppUrl, setMessageHomework } from "@/lib/whatsapp";
import PreparationRoster from "@/components/preparation/preparation-roster";
import { preparationMessageLines, type PreparationStudent } from "@/lib/preparation";

export default function SendClassUpdateButton({
  sessionId,
  size = "sm",
  className,
  disabled = false,
}: {
  sessionId: string;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [students, setStudents] = useState<PreparationStudent[]>([]);
  const [step, setStep] = useState<"students" | "homework" | "preview">("students");
  const [homeworkGiven, setHomeworkGiven] = useState<"yes" | "no" | null>(null);
  const [homework, setHomework] = useState("");
  const [saving, setSaving] = useState(false);
  const [slot, setSlot] = useState({ classId: "", date: "", timetableEntryId: null as string | null });
  const [rules, setRules] = useState({ threshold: 3, includePartial: false });
  const validPhone = !!phoneNumber.trim() && optionalWhatsAppSchema.safeParse(phoneNumber).success;

  async function openPreview() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/attendance-sessions/${sessionId}/whatsapp-message?template=separate`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not generate class update.");
      setPhoneNumber(data.phone_number);
      setMessage(data.message);
      setStudents(data.students.map((student: PreparationStudent) => ({
        ...student,
        preparation_status: student.preparation_status === "NOT_MARKED" ? "FULL" : student.preparation_status,
      })));
      setSlot({ classId: data.class_id, date: data.attendance_date, timetableEntryId: data.timetable_entry_id });
      setRules({ threshold: data.threshold, includePartial: data.includePartial });
      setStep("students");
      setHomeworkGiven(null);
      setHomework("");
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate class update.");
    } finally {
      setLoading(false);
    }
  }

  async function saveStudents() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/classes/${slot.classId}/preparation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: slot.date, timetable_entry_id: slot.timetableEntryId,
          records: students.map((student) => ({ student_id: student.student_id, preparation_status: student.preparation_status })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save unprepared students.");
      }
      const heading = "*UNPREPARED STUDENTS*";
      setMessage((current) => `${current.split(heading)[0]}${heading}\n${
        preparationMessageLines(students).join("\n")
      }`);
      setStep("homework");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save unprepared students.");
    } finally {
      setSaving(false);
    }
  }

  function previewHomework() {
    setError("");
    if (!homeworkGiven) {
      setError("Please choose whether homework was provided.");
      return;
    }
    if (homeworkGiven === "yes" && !homework.trim()) {
      setError("Please enter the homework that was provided.");
      return;
    }
    setMessage((current) => setMessageHomework(current, homeworkGiven === "yes" ? homework : null));
    setStep("preview");
  }

  return (
    <>
      <Button
        type="button"
        variant="whatsapp"
        size={size}
        className={className}
        disabled={disabled || loading}
        onClick={openPreview}
      >
        {loading ? "Loading..." : "Send Class Update"}
      </Button>
      {error && !open && <p role="alert" className="w-full text-sm text-red-700">{error}</p>}
      <Modal
        open={open}
        title={step === "students" ? "Mark Student Preparation" : step === "homework" ? "Homework for This Class" : "Class Update — Separate Recipient"}
        onClose={() => { if (!saving) setOpen(false); }}
        maxWidth="lg"
        footer={
          <div className={modalFooterClassName}>
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setError("");
                if (step === "preview") setStep("homework");
                else if (step === "homework") setStep("students");
                else setOpen(false);
              }}
              className="w-full sm:w-auto"
            >
              {step === "preview" ? "Back to Homework" : step === "homework" ? "Back to Students" : "Cancel"}
            </Button>
            {step === "students" ? (
              <Button onClick={saveStudents} disabled={saving} className="w-full sm:w-auto">
                {saving ? "Saving..." : "Save & Continue"}
              </Button>
            ) : step === "homework" ? (
              <Button onClick={previewHomework} className="w-full sm:w-auto">
                Preview Message
              </Button>
            ) : validPhone && message.trim() ? (
              <ButtonLink
                href={buildWhatsAppUrl(phoneNumber, message)}
                variant="whatsapp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                Open WhatsApp
              </ButtonLink>
            ) : (
              <Button variant="whatsapp" disabled className="w-full sm:w-auto">
                Open WhatsApp
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {step === "students" ? (
            <PreparationRoster students={students} onChange={setStudents} disabled={saving} {...rules} />
          ) : step === "homework" ? (
            <>
              <fieldset className="space-y-3">
                <legend className="mb-3 text-sm font-medium text-slate-900">Was any homework provided?</legend>
                {([ ["yes", "Yes, homework was provided"], ["no", "No homework was provided"] ] as const).map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                    <input type="radio" name={`homework-${sessionId}`} value={value} checked={homeworkGiven === value}
                      onChange={() => { setHomeworkGiven(value); setError(""); }} />
                    {label}
                  </label>
                ))}
              </fieldset>
              {homeworkGiven === "yes" && (
                <FormField label="What homework was provided?" hint="These details will appear under HW in the message.">
                  <textarea aria-label="Homework details" className={inputClassName(false)} rows={4} required
                    value={homework} onChange={(e) => setHomework(e.target.value)}
                    placeholder="For example: Complete questions 1–5 on page 42." />
                </FormField>
              )}
              {homeworkGiven === "no" && <p className="text-sm text-slate-600">The message will say: No homework assigned.</p>}
            </>
          ) : (
            <>
              <FormField
                label="Recipient WhatsApp Number"
                hint="Include the country code. Changes here apply to this message only."
                error={phoneNumber && !validPhone ? "Enter 10–15 digits including the country code." : undefined}
              >
                <TextInput
                  aria-label="Recipient WhatsApp Number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="91XXXXXXXXXX"
                />
              </FormField>
              <p className="text-sm text-slate-600">
                Save the default recipient in{" "}
                <Link href="/settings" className="text-blue-600 hover:underline">
                  Settings → Communication
                </Link>.
              </p>
              <FormField label="Message" hint="Review the details before sending. Use Back to Homework to change the homework answer, or go back again to edit preparation.">
                <textarea
                  aria-label="Class update message"
                  className={inputClassName(false, "w-full min-h-80 font-mono")}
                  rows={17}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </FormField>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
