"use client";

import { useState } from "react";
import type { WhatsAppMessageData } from "@/lib/types";

const emptyData: WhatsAppMessageData = {
  phone_number: "",
  message: "",
  whatsapp_url: "",
  class_id: "",
  attendance_date: "",
  class_time: null,
  missing_items: [],
};

export function useWhatsAppMessage() {
  const [open, setOpen] = useState(false);
  const [missingOpen, setMissingOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<WhatsAppMessageData>(emptyData);

  async function openPreview(sessionId: string) {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/attendance-sessions/${sessionId}/whatsapp-message`);
    const payload = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(payload.error ?? "Could not generate WhatsApp message.");
      return false;
    }

    setData(payload);

    if (payload.missing_items?.length > 0) {
      setMissingOpen(true);
      return true;
    }

    setOpen(true);
    return true;
  }

  function closePreview() {
    setOpen(false);
  }

  function confirmDespiteMissing() {
    setMissingOpen(false);
    setOpen(true);
  }

  function cancelMissingPrompt() {
    setMissingOpen(false);
  }

  return {
    open,
    missingOpen,
    loading,
    error,
    data,
    openPreview,
    closePreview,
    confirmDespiteMissing,
    cancelMissingPrompt,
  };
}
