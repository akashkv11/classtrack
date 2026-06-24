"use client";

import { useState } from "react";
import WhatsAppPreview from "@/components/WhatsAppPreview";

type SendWhatsAppButtonProps = {
  sessionId: string;
  className?: string;
};

const defaultClassName =
  "rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60";

export default function SendWhatsAppButton({
  sessionId,
  className = defaultClassName,
}: SendWhatsAppButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [whatsappData, setWhatsappData] = useState({
    phone_number: "",
    message: "",
    whatsapp_url: "",
  });

  async function openWhatsAppPreview() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/attendance-sessions/${sessionId}/whatsapp-message`);
    const payload = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(payload.error ?? "Could not generate WhatsApp message.");
      return;
    }

    setWhatsappData(payload);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openWhatsAppPreview}
        disabled={loading}
        className={className}
      >
        {loading ? "Loading..." : "Send WhatsApp"}
      </button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
      <WhatsAppPreview
        open={open}
        phoneNumber={whatsappData.phone_number}
        message={whatsappData.message}
        whatsappUrl={whatsappData.whatsapp_url}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
