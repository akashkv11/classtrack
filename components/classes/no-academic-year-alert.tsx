import Link from "next/link";
import { WarningPanel } from "@/components/ui/alert";

export default function NoAcademicYearAlert() {
  return (
    <WarningPanel
      title="No active academic year"
      description={
        <>
          Go to{" "}
          <Link href="/settings" className="font-medium underline">
            Settings
          </Link>{" "}
          to set one up.
        </>
      }
      className="mt-8"
    />
  );
}
