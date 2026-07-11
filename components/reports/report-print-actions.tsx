"use client";

import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";

type ReportPrintActionsProps = {
  disabled?: boolean;
  printLabel?: string;
  pdfLabel?: string;
};

export function printReport() {
  window.print();
}

export default function ReportPrintActions({
  disabled = false,
  printLabel = "Print",
  pdfLabel = "Save as PDF",
}: ReportPrintActionsProps) {
  return (
    <div className="print:hidden">
      <ActionBar className="justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
          disabled={disabled}
          onClick={printReport}
        >
          {printLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          className={actionButtonClassName}
          disabled={disabled}
          onClick={printReport}
          title="Opens the print dialog — choose Save as PDF as the destination"
        >
          {pdfLabel}
        </Button>
      </ActionBar>
      <p className="mt-2 text-right text-xs text-slate-500">
        Preview the report below, then print or save as PDF from your browser.
      </p>
    </div>
  );
}
