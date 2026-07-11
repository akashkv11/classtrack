"use client";

import { Button } from "@/components/ui/button";
import WhatsAppPreview from "@/components/whatsapp/whatsapp-preview";
import WhatsAppMissingItemsDialog from "@/components/whatsapp/whatsapp-missing-items-dialog";
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
  const {
    open,
    missingOpen,
    loading,
    error,
    data,
    openPreview,
    closePreview,
    confirmDespiteMissing,
    cancelMissingPrompt,
  } = useWhatsAppMessage();

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
      <WhatsAppMissingItemsDialog
        open={missingOpen}
        items={data.missing_items}
        onSendAnyway={confirmDespiteMissing}
        onClose={cancelMissingPrompt}
      />
      <WhatsAppPreview
        key={`${data.message}-${data.class_time ?? ""}`}
        open={open}
        phoneNumber={data.phone_number}
        message={data.message}
        whatsappUrl={data.whatsapp_url}
        classTime={data.class_time}
        onClose={closePreview}
      />
    </>
  );
}
