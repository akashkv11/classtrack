"use client";

import Link from "next/link";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { WhatsAppMissingItem } from "@/lib/whatsapp-readiness";

type WhatsAppMissingItemsDialogProps = {
  open: boolean;
  items: WhatsAppMissingItem[];
  onSendAnyway: () => void;
  onClose: () => void;
};

export default function WhatsAppMissingItemsDialog({
  open,
  items,
  onSendAnyway,
  onClose,
}: WhatsAppMissingItemsDialogProps) {
  return (
    <Modal
      open={open}
      title="Complete required details"
      onClose={onClose}
      maxWidth="lg"
      footer={
        <div className={modalFooterClassName}>
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Go back
          </Button>
          <Button variant="whatsapp" onClick={onSendAnyway} className="w-full sm:w-auto">
            Send anyway
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        Some required details for the WhatsApp update message are missing. Fix them first,
        or send the message with the incomplete sections.
      </p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <p className="font-medium text-slate-900">{item.label}</p>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            <Link
              href={item.fix_href}
              className="mt-2 inline-block text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Fix this →
            </Link>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
