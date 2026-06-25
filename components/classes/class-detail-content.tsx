"use client";

import { useEffect, useState } from "react";
import RecentSessionsList from "@/components/classes/recent-sessions-list";
import StudentsSection from "@/components/students/students-section";
import Tabs from "@/components/ui/tabs";

type Session = {
  id: string;
  date: string;
};

type ClassDetailContentProps = {
  classId: string;
  sessions: Session[];
};

type ClassTab = "attendance" | "students";

const classTabs = [
  { id: "attendance", label: "Recent Attendance Dates" },
  { id: "students", label: "Students" },
] as const;

function tabFromHash(hash: string): ClassTab {
  return hash === "#students" ? "students" : "attendance";
}

export default function ClassDetailContent({ classId, sessions }: ClassDetailContentProps) {
  const [activeTab, setActiveTab] = useState<ClassTab>("attendance");

  useEffect(() => {
    const syncTab = () => setActiveTab(tabFromHash(window.location.hash));
    syncTab();
    window.addEventListener("hashchange", syncTab);
    return () => window.removeEventListener("hashchange", syncTab);
  }, []);

  function handleTabChange(tabId: string) {
    const tab = tabId as ClassTab;
    setActiveTab(tab);

    const nextUrl =
      tab === "students"
        ? `${window.location.pathname}#students`
        : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  }

  return (
    <section className="mb-10">
      <Tabs tabs={[...classTabs]} activeTab={activeTab} onChange={handleTabChange} />

      {activeTab === "attendance" ? (
        <RecentSessionsList classId={classId} sessions={sessions} showTitle={false} />
      ) : (
        <StudentsSection classId={classId} showTitle={false} />
      )}
    </section>
  );
}
