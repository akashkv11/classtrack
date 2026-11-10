"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StudentForm from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import type { Student, StudentFormData } from "@/lib/types";

export default function EditStudentButton({ student }: { student: Student }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(data: StudentFormData) {
    const res = await fetch(`/api/students/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Could not update student.");
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => {
        setSaved(false);
        setOpen(true);
      }}>
        Edit Student
      </Button>
      {saved && <p role="status" className="text-sm text-green-700">Student updated.</p>}
      {open && <StudentForm open student={student} onClose={() => setOpen(false)} onSave={save} />}
    </>
  );
}
