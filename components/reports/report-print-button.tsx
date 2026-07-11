"use client";

import { Button } from "@/components/ui/button";

type ReportPrintButtonProps = {
  label?: string;
};

export default function ReportPrintButton({
  label = "Print Report",
}: ReportPrintButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="print:hidden"
      onClick={() => window.print()}
    >
      {label}
    </Button>
  );
}
