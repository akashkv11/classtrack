import { Button } from "@/components/ui/button";

type ModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  maxWidth?: "md" | "lg";
};

const maxWidthClasses = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
} as const;

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  maxWidth = "md",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className={`flex max-h-[90vh] w-full flex-col ${maxWidthClasses[maxWidth]} rounded-t-xl bg-white shadow-xl sm:rounded-xl`}
      >
        <div className="overflow-y-auto p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
          {children}
        </div>
        {footer ? (
          <div className="border-t border-slate-200 p-4 sm:p-6 sm:pt-0">{footer}</div>
        ) : (
          <div className="border-t border-slate-200 p-4 sm:border-0 sm:p-6 sm:pt-0">
            <div className="flex justify-end">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const modalFooterClassName =
  "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end";
