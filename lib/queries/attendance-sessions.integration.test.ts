import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { upsertAttendanceSessionForSlot } from "./attendance-sessions";

// Explicit opt-in: all writes are confined to a disposable schema, removed in finally.
test("sessions stay separate, snapshots persist, and concurrent diary creation is guarded", { skip: !process.env.SESSION_INTEGRATION_TEST }, async () => {
  const schema = `session_test_${randomUUID().replaceAll("-", "")}`;
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  const admin = new Pool({ connectionString });
  const pool = new Pool({ connectionString, options: `-c search_path=${schema}` });
  const db = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    for (const table of ["attendance_sessions", "attendance_records", "teaching_diary_entries", "timetable_entries"]) {
      await admin.query(`CREATE TABLE "${schema}"."${table}" (LIKE public."${table}" INCLUDING ALL)`);
    }
    await pool.query(await readFile("prisma/migrations/20261115010000_unique_diary_session/migration.sql", "utf8"));
    const classId = randomUUID();
    const attendanceDate = new Date("2026-11-15T00:00:00Z");
    const options = { classId, attendanceDate, timetableEntryId: null, notes: "", subject: "Maths", startTime: "09:00", endTime: "10:00" };
    const first = await db.$transaction(tx => upsertAttendanceSessionForSlot(tx, options));
    const second = await db.$transaction(tx => upsertAttendanceSessionForSlot(tx, { ...options, startTime: "09:30", endTime: "10:30" }));
    assert.notEqual(first.id, second.id); // overlapping same-day sessions are valid
    const studentId = randomUUID();
    await db.attendanceRecord.createMany({ data: [
      { sessionId: first.id, studentId, status: "present" },
      { sessionId: second.id, studentId, status: "absent" },
    ] });
    await db.$transaction(tx => upsertAttendanceSessionForSlot(tx, { ...options, sessionId: first.id, notes: "Updated", subject: "Should not change" }));
    assert.equal((await db.attendanceSession.findUniqueOrThrow({ where: { id: first.id } })).subject, "Maths");
    assert.equal((await db.attendanceRecord.findFirstOrThrow({ where: { sessionId: second.id } })).status, "absent");
    await assert.rejects(db.$transaction(tx => upsertAttendanceSessionForSlot(tx, { ...options, sessionId: first.id, classId: randomUUID() })));
    const timetable = await db.timetableEntry.create({ data: { classId, subject: "Science", scheduleType: "ONE_TIME", entryDate: attendanceDate, startTime: "11:00", endTime: "12:00", repeatDays: [], scheduleExceptions: [] } });
    const scheduledOptions = { ...options, timetableEntryId: timetable.id };
    const scheduled = await db.$transaction(tx => upsertAttendanceSessionForSlot(tx, scheduledOptions));
    await db.timetableEntry.update({ where: { id: timetable.id }, data: { subject: "Changed", startTime: "13:00", endTime: "14:00" } });
    const reopened = await db.$transaction(tx => upsertAttendanceSessionForSlot(tx, scheduledOptions));
    assert.equal(reopened.id, scheduled.id);
    assert.equal(reopened.subject, "Science");
    assert.equal(reopened.startTime, "11:00");
    const diary = { classId, entryDate: attendanceDate, topicTaught: "Revision", diaryStatus: "REVISION" };
    const results = await Promise.allSettled([
      db.teachingDiaryEntry.create({ data: { ...diary, sessionId: first.id } }),
      db.teachingDiaryEntry.create({ data: { ...diary, sessionId: first.id } }),
    ]);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    assert.equal(results.filter(r => r.status === "rejected").length, 1);
    const rejected = results.find(r => r.status === "rejected");
    assert.equal(rejected?.status === "rejected" ? rejected.reason.code : null, "P2002");
    await db.teachingDiaryEntry.create({ data: { ...diary, sessionId: second.id } });
    assert.equal(await db.teachingDiaryEntry.count(), 2);
  } finally {
    await db.$disconnect();
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});
