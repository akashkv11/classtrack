"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge";
import FormField, { SelectInput, TextInput } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/loading-state";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { StudentDirectoryItem } from "@/lib/types/student-profile";

type StudentProfileDirectoryProps = {
  classes: { id: string; display_name: string }[];
  students: StudentDirectoryItem[];
};

type StatusFilter = "active" | "inactive" | "all";

function matchesSearch(student: StudentDirectoryItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  if (student.full_name.toLowerCase().includes(normalized)) return true;
  if (student.admission_no?.toLowerCase().includes(normalized)) return true;
  if (student.class.display_name.toLowerCase().includes(normalized)) return true;
  if (String(student.roll_no).includes(normalized)) return true;

  return false;
}

export default function StudentProfileDirectory({
  classes,
  students,
}: StudentProfileDirectoryProps) {
  const router = useRouter();
  const [classId, setClassId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [search, setSearch] = useState("");

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (classId !== "all" && student.class.id !== classId) return false;
      if (status === "active" && !student.is_active) return false;
      if (status === "inactive" && student.is_active) return false;
      return matchesSearch(student, search);
    });
  }, [students, classId, status, search]);

  const activeCount = students.filter((student) => student.is_active).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Classes</p>
          <p className="text-2xl font-bold text-slate-900">{classes.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Active students</p>
          <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-slate-600">Showing</p>
          <p className="text-2xl font-bold text-slate-900">{filteredStudents.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Class">
            <SelectInput
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
            >
              <option value="all">All classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.display_name}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Status">
            <SelectInput
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </SelectInput>
          </FormField>

          <FormField label="Search" hint="Name, roll no, admission no, or class">
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students..."
            />
          </FormField>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState message="No students match your filters." />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Roll</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Class</TableHeaderCell>
              <TableHeaderCell>Admission No</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Profile</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => {
              const profileHref = `/classes/${student.class.id}/students/${student.id}?from=student-profile`;

              return (
                <TableRow
                  key={student.id}
                  className="cursor-pointer hover:bg-blue-50/40"
                  onClick={() => router.push(profileHref)}
                >
                  <TableCell>{student.roll_no}</TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {student.full_name}
                  </TableCell>
                  <TableCell>{student.class.display_name}</TableCell>
                  <TableCell>{student.admission_no ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={student.is_active ? "success" : "neutral"}>
                      {student.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={profileHref}
                      className="font-medium text-blue-700 hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      View profile
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
