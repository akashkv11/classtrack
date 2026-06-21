"use client";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">WhatsApp Message Preview</h2>
        <p className="mb-3 text-sm text-slate-600">
          Send To: <span className="font-medium text-slate-900">{phoneNumber}</span>
        </p>
        <pre className="mb-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
          {message}
        </pre>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Open WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
