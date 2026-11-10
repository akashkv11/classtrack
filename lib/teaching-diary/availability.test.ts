import assert from "node:assert/strict";
import test from "node:test";
import { filterChaptersForDiaryForm, filterTopicsForDiaryForm } from "./availability";
import type { SyllabusChapterSummary, SyllabusTopic } from "../types/syllabus";

function topic(id: string, status: string): SyllabusTopic {
  return { id, topic_title: id, status, priority: "NORMAL", estimated_classes: null, remarks: null, subtopics: [] };
}
function chapter(id: string, topics: SyllabusTopic[]): SyllabusChapterSummary {
  return { id, chapter_number: null, chapter_title: id, chapter_summary: null, display_order: 0,
    progress_percentage: 0, topics_count: topics.length, subtopics_count: 0,
    status_summary: { total: topics.length, not_started: 0, in_progress: 0, completed: 0, revised: 0, skipped: 0, progress_percentage: 0 }, topics };
}
const topics = [topic("completed", "COMPLETED"), topic("revised", "REVISED"), topic("diary-taught", "NOT_STARTED"), topic("new", "NOT_STARTED")];
const taught = new Set(["diary-taught"]);
const chapters = [chapter("finished", topics.slice(0, 3)), chapter("remaining", topics.slice(3)), chapter("empty", [])];

test("revision lists every chapter and topic, including completed, revised and empty chapters", () => {
  assert.deepEqual(filterChaptersForDiaryForm(chapters, taught, null, [], "REVISION"), chapters);
  assert.deepEqual(filterTopicsForDiaryForm(topics, taught, [], "REVISION"), topics);
});

test("regular teaching still hides completed work and preserves the current selections", () => {
  assert.deepEqual(filterChaptersForDiaryForm(chapters, taught).map(c => c.id), ["remaining"]);
  assert.deepEqual(filterTopicsForDiaryForm(topics, taught).map(t => t.id), ["new"]);
  assert.deepEqual(filterChaptersForDiaryForm(chapters, taught, "finished").map(c => c.id), ["finished", "remaining"]);
  assert.deepEqual(filterTopicsForDiaryForm(topics, taught, ["completed"]).map(t => t.id), ["completed", "new"]);
});
