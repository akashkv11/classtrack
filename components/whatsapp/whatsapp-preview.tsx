"use client";

import Modal from "@/components/ui/modal";
import { Button, ButtonLink } from "@/components/ui/button";

type WhatsAppPreviewProps = {
  open: boolean;
  phoneNumber: string;
  message: string;
  whatsappUrl: string;
  onClose: () => void;
};

export default function WhatsAppPreview({
  open,
  phoneNumber,
  message,
  whatsappUrl,
  onClose,
}: WhatsAppPreviewProps) {
  return (
    <Modal
      open={open}
      title="WhatsApp Message Preview"
      onClose={onClose}
      maxWidth="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <ButtonLink href={whatsappUrl} variant="whatsapp" target="_blank" rel="noopener noreferrer">
            Open WhatsApp
          </ButtonLink>
        </div>
      }
    >
      <p className="mb-3 text-sm text-slate-600">
        Send To: <span className="font-medium text-slate-900">{phoneNumber}</span>
      </p>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
        {message}
      </pre>
    </Modal>
  );
}
