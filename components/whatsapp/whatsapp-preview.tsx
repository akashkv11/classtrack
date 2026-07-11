"use client";

import { useMemo, useState } from "react";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import { Button, ButtonLink } from "@/components/ui/button";
import FormField, { TextInput } from "@/components/ui/form-field";
import { buildWhatsAppUrl, setMessageClassTime } from "@/lib/whatsapp";

type WhatsAppPreviewProps = {
  open: boolean;
  phoneNumber: string;
  message: string;
  whatsappUrl: string;
  classTime: string | null;
  onClose: () => void;
};

export default function WhatsAppPreview({
  open,
  phoneNumber,
  message,
  whatsappUrl,
  classTime,
  onClose,
}: WhatsAppPreviewProps) {
  if (!open) return null;

  return (
    <WhatsAppPreviewDialog
      phoneNumber={phoneNumber}
      message={message}
      whatsappUrl={whatsappUrl}
      classTime={classTime}
      onClose={onClose}
    />
  );
}

function WhatsAppPreviewDialog({
  phoneNumber,
  message,
  whatsappUrl,
  classTime,
  onClose,
}: Omit<WhatsAppPreviewProps, "open">) {
  const [editedClassTime, setEditedClassTime] = useState(classTime ?? "");

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

      <div className="mb-4">
        <FormField
          label="Class Time"
          hint="Edit if today's class time changed. Example: 09:30 AM - 10:30 AM"
        >
          <TextInput
            value={editedClassTime}
            onChange={(e) => setEditedClassTime(e.target.value)}
            placeholder="09:30 AM - 10:30 AM"
          />
        </FormField>
      </div>

      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
        {previewMessage}
      </pre>
    </Modal>
  );
}
