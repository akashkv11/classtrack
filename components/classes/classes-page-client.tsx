"use client";

import { useState } from "react";
import ClassListCard from "@/components/classes/class-list-card";
import CreateClassForm from "@/components/classes/create-class-form";
import { EmptyState } from "@/components/ui/loading-state";

type ClassListItem = {
  id: string;
  displayName: string;
  studentCount: number;
  todayStatus: "marked" | "not_marked";
};

type ClassesPageClientProps = {
  hasActiveYear: boolean;
  initialClasses: ClassListItem[];
};

export default function ClassesPageClient({
  hasActiveYear,
  initialClasses,
}: ClassesPageClientProps) {
  const [classes, setClasses] = useState(initialClasses);

  async function refreshClasses() {
    const res = await fetch("/api/classes");
    if (!res.ok) return;
    const data: {
      id: string;
      display_name: string;
      student_count: number;
      today_status: "marked" | "not_marked";
    }[] = await res.json();
    setClasses(
      data.map((cls) => ({
        id: cls.id,
        displayName: cls.display_name,
        studentCount: cls.student_count,
        todayStatus: cls.today_status,
      })),
    );
  }

  if (!hasActiveYear) {
    return null;
  }

  return (
    <>
      <CreateClassForm onCreated={refreshClasses} />

      {classes.length === 0 ? (
        <EmptyState message="No classes yet. Create your first class above." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((cls) => (
            <ClassListCard
              key={cls.id}
              id={cls.id}
              displayName={cls.displayName}
              studentCount={cls.studentCount}
              todayStatus={cls.todayStatus}
            />
          ))}
        </div>
      )}
    </>
  );
}
