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
  md: "max-w-md",
  lg: "max-w-lg",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${maxWidthClasses[maxWidth]} rounded-xl bg-white p-6 shadow-xl`}>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
        {children}
        {footer ?? (
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
