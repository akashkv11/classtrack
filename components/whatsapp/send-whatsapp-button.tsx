"use client";

import { Button } from "@/components/ui/button";
import WhatsAppPreview from "@/components/whatsapp/whatsapp-preview";
import { useWhatsAppMessage } from "@/components/whatsapp/use-whatsapp-message";

type SendWhatsAppButtonProps = {
  sessionId: string;
  size?: "sm" | "md";
  className?: string;
};

export default function SendWhatsAppButton({
  sessionId,
  size = "sm",
  className,
}: SendWhatsAppButtonProps) {
  const { open, loading, error, data, openPreview, closePreview } = useWhatsAppMessage();

  return (
    <>
      <Button
        type="button"
        variant="whatsapp"
        size={size}
        onClick={() => openPreview(sessionId)}
        disabled={loading}
        className={className}
      >
        {loading ? "Loading..." : "Send WhatsApp"}
      </Button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
      <WhatsAppPreview
        open={open}
        phoneNumber={data.phone_number}
        message={data.message}
        whatsappUrl={data.whatsapp_url}
        onClose={closePreview}
      />
    </>
  );
}
