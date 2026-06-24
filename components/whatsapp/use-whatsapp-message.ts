"use client";

import { useState } from "react";
import type { WhatsAppMessageData } from "@/lib/types";

export function useWhatsAppMessage() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<WhatsAppMessageData>({
    phone_number: "",
    message: "",
    whatsapp_url: "",
  });

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
    setOpen(true);
    return true;
  }

  function closePreview() {
    setOpen(false);
  }

  return {
    open,
    loading,
    error,
    data,
    openPreview,
    closePreview,
  };
}
