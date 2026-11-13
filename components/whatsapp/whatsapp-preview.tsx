"use client";

import { useMemo, useState } from "react";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import { Button, ButtonLink } from "@/components/ui/button";
import FormField, { SelectInput, TextInput } from "@/components/ui/form-field";
import { buildWhatsAppUrl, formatClassTimeRange, setMessageClassTime } from "@/lib/whatsapp";

import type { WhatsAppPeriodOption } from "@/lib/types/attendance";

type WhatsAppPreviewProps = {
  periodOptions: WhatsAppPeriodOption[];
  open: boolean;
  phoneNumber: string;
  message: string;
  whatsappUrl: string;
  classTime: string | null;
  onClose: () => void;
};

function toTimeInputValue(time: string): string {
  const match = time.trim().match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!match) return "";

  const hours = Number(match[1]) % 12 + (match[3] === "PM" ? 12 : 0);
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

export default function WhatsAppPreview({
  open,
  phoneNumber,
  message,
  whatsappUrl,
  classTime,
  periodOptions,
  onClose,
}: WhatsAppPreviewProps) {
  if (!open) return null;

  return (
    <WhatsAppPreviewDialog
      phoneNumber={phoneNumber}
      message={message}
      whatsappUrl={whatsappUrl}
      classTime={classTime}
      periodOptions={periodOptions}
      onClose={onClose}
    />
  );
}

function WhatsAppPreviewDialog({
  phoneNumber,
  message,
  whatsappUrl,
  classTime,
  periodOptions,
  onClose,
}: Omit<WhatsAppPreviewProps, "open">) {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [initialStart, initialEnd] = (classTime ?? "").split(" - ");
  const [startTime, setStartTime] = useState(toTimeInputValue(initialStart ?? ""));
  const [endTime, setEndTime] = useState(toTimeInputValue(initialEnd ?? ""));
  const editedClassTime = startTime && endTime
    ? formatClassTimeRange(startTime, endTime)
    : "";

  const previewMessage = useMemo(
    () => setMessageClassTime(message, editedClassTime || null),
    [message, editedClassTime],
  );

  const previewUrl = useMemo(
    () => buildWhatsAppUrl(phoneNumber, previewMessage),
    [phoneNumber, previewMessage],
  );

  return (
    <Modal
      open
      title="WhatsApp Message Preview"
      onClose={onClose}
      maxWidth="lg"
      footer={
        <div className={modalFooterClassName}>
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <ButtonLink
            href={previewUrl || whatsappUrl}
            variant="whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            Open WhatsApp
          </ButtonLink>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        Send To: <span className="font-medium text-slate-900">{phoneNumber}</span>
      </p>

      {periodOptions.length > 1 && (
        <div className="mb-4">
          <FormField label="Timetable Period" hint="Select a period to load its start and end time.">
            <SelectInput
              aria-label="Timetable Period"
              value={selectedPeriod}
              onChange={(event) => {
                const period = periodOptions.find((option) => option.id === event.target.value);
                setSelectedPeriod(event.target.value);
                if (period) {
                  setStartTime(period.start_time);
                  setEndTime(period.end_time);
                }
              }}
            >
              <option value="" disabled>Select a period</option>
              {periodOptions.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.subject} · {formatClassTimeRange(period.start_time, period.end_time)}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <FormField label="Start Time" hint="Edit if today's class time changed.">
          <TextInput
            type="time"
            aria-label="Start Time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </FormField>
        <FormField label="End Time">
          <TextInput
            type="time"
            aria-label="End Time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </FormField>
      </div>

      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
        {previewMessage}
      </pre>
    </Modal>
  );
}
