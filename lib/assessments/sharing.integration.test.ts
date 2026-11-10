import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { NextRequest } from "next/server";

// Opt in against a migrated development database. All fixtures are removed in finally.
test("parent assessment publication, lookup and access controls", { skip: process.env.RUN_PARENT_RESULTS_DB_TESTS !== "1" }, async (t) => {
  const { prisma } = await import("@/lib/db");
  const { createSessionToken } = await import("@/lib/auth");
  const { changeAssessmentSharing, lookupParentResult, getParentAssessment, publishAssessmentOnFirstSave } = await import("./sharing");
  const { POST: saveMarks } = await import("@/app/api/assessments/[assessmentId]/marks/route");
  const { POST: share } = await import("@/app/api/assessments/[assessmentId]/sharing/route");
  const { POST: lookup } = await import("@/app/api/results/[token]/lookup/route");
  const { proxy } = await import("@/proxy");
  const cookie = `classtrack_session=${await createSessionToken()}`;
  const yearId = randomUUID();
  const request = (path: string, data: unknown, authenticated = false) => new NextRequest(`http://localhost:3000${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", ...(authenticated ? { cookie } : {}) }, body: JSON.stringify(data),
  });
  try {
    await prisma.academicYear.create({ data: { id: yearId, name: `Parent results test ${yearId}`, startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31") } });
    const cls = await prisma.class.create({ data: { academicYearId: yearId, level: "TEST", stream: "TEST", displayName: "Results Test Class" } });
    const otherClass = await prisma.class.create({ data: { academicYearId: yearId, level: "OTHER", stream: "TEST", displayName: "Other Results Test Class" } });
    const subject = await prisma.syllabusSubject.create({ data: { classId: cls.id, subjectName: "Test Science" } });
    const chapter = await prisma.syllabusChapter.create({ data: { syllabusSubjectId: subject.id, chapterNumber: 1, chapterTitle: "Main Chapter" } });
    const topic = await prisma.syllabusTopic.create({ data: { syllabusChapterId: chapter.id, topicTitle: "Main Topic", subtopics: [{ subtopic_title: "Private subtopic", nested_subtopics: [] }] } });
    const names = ["Alex Example", "Alex   Example", "Absent Example", "Zero Example", "No Saved Result"];
    const students: { id: string }[] = [];
    for (let i = 0; i < names.length; i++) students.push(await prisma.student.create({ data: { classId: cls.id, rollNo: i + 1, fullName: names[i], parentPhone: "9999999999", isActive: i < 4 } }));
    const foreignStudent = await prisma.student.create({ data: { classId: otherClass.id, rollNo: 1, fullName: "Foreign Example" } });
    const makeAssessment = (name: string) => prisma.assessment.create({ data: { classId: cls.id, syllabusSubjectId: subject.id, syllabusChapterId: chapter.id, name, assessmentType: "CLASS_TEST", assessmentDate: new Date("2026-11-11"), maxMarks: 30, remarks: "Internal assessment note", topics: { create: { syllabusTopicId: topic.id } } } });
    const assessment = await makeAssessment("Parent Results Test");
    const marksPath = `/api/assessments/${assessment.id}/marks?class_id=${cls.id}`;
    const ctx = { params: Promise.resolve({ assessmentId: assessment.id }) };
    const records = students.slice(0, 4).map((student, index) => ({ student_id: student.id, marks_obtained: [12.5, 25, null, 0][index], remarks: index === 0 ? "Good effort" : null }));
    let token = "";
    await t.test("creation stays private; authenticated first save publishes, invalid/duplicate saves do not", async () => {
      assert.equal(assessment.shareToken, null);
      assert.equal(assessment.sharingEnabled, false);
      const noMarks = await changeAssessmentSharing(assessment.id, cls.id, "enable");
      assert.equal("error" in noMarks, true);
      assert.equal((await saveMarks(request(marksPath, { records }), ctx)).status, 401);
      const invalid = await saveMarks(request(marksPath, { records: records.map((record, i) => i === 0 ? { ...record, marks_obtained: 31 } : record) }, true), ctx);
      assert.equal(invalid.status, 400);
      assert.equal((await prisma.assessment.findUniqueOrThrow({ where: { id: assessment.id } })).shareToken, null);
      const duplicate = await saveMarks(request(marksPath, { records: [records[0], records[0], records[2], records[3]] }, true), ctx);
      assert.equal(duplicate.status, 400);
      const response = await saveMarks(request(marksPath, { records }, true), ctx);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.sharing.enabled, true);
      assert.equal(body.sharing.has_saved_marks, true);
      token = body.sharing.path.split("/").pop();
      assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    });
    await t.test("public lookup requires roll only for duplicate full names and returns a strict result projection", async () => {
      const roll = await lookupParentResult(token, "  ALEX  EXAMPLE ");
      assert.deepEqual(roll, { status: "roll_required" });
      assert.deepEqual(await lookupParentResult(token, "Alex Example", 99), { status: "not_found" });
      const response = await lookup(request(`/api/results/${token}/lookup`, { name: "alex example", roll_no: 1, student_id: foreignStudent.id }), { params: Promise.resolve({ token }) });
      assert.equal(response.status, 200);
      assert.match(response.headers.get("cache-control") ?? "", /no-store/);
      const body = await response.json();
      assert.equal(body.result.student_name, "Alex Example");
      assert.equal(body.result.marks_obtained, 12.5);
      assert.equal(body.result.percentage, 41.67);
      assert.equal(body.result.remarks, "Good effort");
      assert.deepEqual(Object.keys(body.result).sort(), ["assessment", "marks_obtained", "percentage", "remarks", "roll_no", "student_name"]);
      assert.deepEqual(body.result.assessment.topics, ["Main Topic"]);
      const serialized = JSON.stringify(body);
      for (const forbidden of ["9999999999", "Internal assessment note", "Private subtopic", foreignStudent.id, "class_average", "student_id", "shareToken"]) assert.equal(serialized.includes(forbidden), false, forbidden);
      assert.deepEqual(await lookupParentResult(token, "Alex"), { status: "not_found" });
      assert.deepEqual(await lookupParentResult(token, "Foreign Example"), { status: "not_found" });
      assert.deepEqual(await lookupParentResult(token, "No Saved Result"), { status: "not_found" });
    });
    await t.test("absence, zero, corrections and inactive students retain correct saved results", async () => {
      const absent = await lookupParentResult(token, "Absent Example");
      assert.equal(absent.status, "found");
      if (absent.status === "found") { assert.equal(absent.result.marks_obtained, null); assert.equal(absent.result.percentage, null); }
      const zero = await lookupParentResult(token, "Zero Example");
      assert.equal(zero.status, "found");
      if (zero.status === "found") { assert.equal(zero.result.marks_obtained, 0); assert.equal(zero.result.percentage, 0); }
      records[0].marks_obtained = 15;
      assert.equal((await saveMarks(request(marksPath, { records }, true), ctx)).status, 200);
      assert.equal((await prisma.assessment.findUniqueOrThrow({ where: { id: assessment.id } })).shareToken, token);
      await prisma.student.update({ where: { id: students[0].id }, data: { isActive: false } });
      const updated = await lookupParentResult(token, "Alex Example", 1);
      assert.equal(updated.status, "found");
      if (updated.status === "found") assert.equal(updated.result.marks_obtained, 15);
    });
    await t.test("sharing controls require authentication and class ownership; disabled links stay disabled on save", async () => {
      const path = `/api/assessments/${assessment.id}/sharing?class_id=${cls.id}`;
      assert.equal((await share(request(path, { action: "disable" }), ctx)).status, 401);
      assert.equal((await share(request(`/api/assessments/${assessment.id}/sharing?class_id=${otherClass.id}`, { action: "disable" }, true), ctx)).status, 403);
      assert.equal((await share(request(path, { action: "disable" }, true), ctx)).status, 200);
      assert.equal(await getParentAssessment(token), null);
      assert.deepEqual(await lookupParentResult(token, "Zero Example"), { status: "unavailable" });
      assert.equal((await saveMarks(request(marksPath, { records: records.slice(1) }, true), ctx)).status, 200);
      assert.equal((await prisma.assessment.findUniqueOrThrow({ where: { id: assessment.id } })).sharingEnabled, false);
      await changeAssessmentSharing(assessment.id, cls.id, "enable");
      assert.ok(await getParentAssessment(token));
      const regenerated = await changeAssessmentSharing(assessment.id, cls.id, "regenerate");
      assert.ok("sharing" in regenerated);
      if (regenerated.sharing) {
        const newToken = regenerated.sharing.path!.split("/").pop()!;
        assert.notEqual(newToken, token);
        assert.equal(await getParentAssessment(token), null);
        token = newToken;
      }
    });
    await t.test("publication rolls back with marks; old assessments can explicitly generate a link", async () => {
      const old = await makeAssessment("Existing Test");
      await assert.rejects(prisma.$transaction(async tx => {
        await tx.assessmentMark.create({ data: { assessmentId: old.id, studentId: students[0].id, marksObtained: 20 } });
        await publishAssessmentOnFirstSave(tx, old.id);
        throw new Error("Simulated save failure");
      }), /Simulated save failure/);
      assert.equal((await prisma.assessment.findUniqueOrThrow({ where: { id: old.id } })).shareToken, null);
      assert.equal(await prisma.assessmentMark.count({ where: { assessmentId: old.id } }), 0);
      await prisma.assessmentMark.create({ data: { assessmentId: old.id, studentId: students[0].id, marksObtained: 20 } });
      const generated = await changeAssessmentSharing(old.id, cls.id, "enable");
      assert.ok(generated.sharing?.enabled);
      // Concurrent first saves preserve one stable token.
      await Promise.all([prisma.$transaction(tx => publishAssessmentOnFirstSave(tx, old.id)), prisma.$transaction(tx => publishAssessmentOnFirstSave(tx, old.id))]);
      assert.equal((await prisma.assessment.findUniqueOrThrow({ where: { id: old.id } })).shareToken, generated.sharing?.path?.split("/").pop() ?? null);
    });
    await t.test("only dedicated public routes bypass authentication; deletion invalidates links", async () => {
      const publicPage = await proxy(new NextRequest(`http://localhost:3000/results/${token}`));
      assert.equal(publicPage.headers.get("x-middleware-next"), "1");
      assert.match(publicPage.headers.get("cache-control") ?? "", /no-store/);
      assert.equal((await proxy(new NextRequest(`http://localhost:3000/api/results/${token}/lookup`, { method: "POST" }))).headers.get("x-middleware-next"), "1");
      assert.equal((await proxy(new NextRequest(`http://localhost:3000/api/assessments/${assessment.id}/marks?class_id=${cls.id}`))).status, 401);
      assert.equal((await proxy(new NextRequest(`http://localhost:3000/api/results/${token}/other`))).status, 401);
      assert.equal((await proxy(new NextRequest("http://localhost:3000/dashboard"))).status, 307);
      assert.equal((await lookup(request(`/api/results/${token}/lookup`, { name: "" }), { params: Promise.resolve({ token }) })).status, 400);
      assert.equal(await getParentAssessment("invalid"), null);
      await prisma.assessment.delete({ where: { id: assessment.id } });
      assert.deepEqual(await lookupParentResult(token, "Zero Example"), { status: "unavailable" });
    });
  } finally {
    const classes = await prisma.class.findMany({ where: { academicYearId: yearId }, select: { id: true } });
    const classIds = classes.map(cls => cls.id);
    await prisma.assessment.deleteMany({ where: { classId: { in: classIds } } });
    await prisma.student.deleteMany({ where: { classId: { in: classIds } } });
    await prisma.academicYear.deleteMany({ where: { id: yearId } });
    await prisma.$disconnect();
    await (globalThis as unknown as { pgPool?: { end: () => Promise<void> } }).pgPool?.end();
  }
});
