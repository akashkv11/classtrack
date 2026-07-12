import { countSubtopics } from "./progress";
import { coerceNestedSubtopicLabels, normalizeImportPriority } from "./normalize";
import {
  importChapterSchema,
  type SyllabusImportPayload,
} from "@/lib/validation/syllabus-schemas";

type RichChapter = {
  chapter_number?: number;
  chapter_title?: string;
  chapter_summary?: string;
  summary?: string;
  topics?: RichTopic[];
  key_terms?: unknown[];
  important_examples?: unknown[];
  exercises_practice?: unknown[];
  activity_practical_work?: unknown[];
  revision_points?: unknown[];
  teaching_usefulness?: unknown;
};

type RichTopic = {
  topic_title?: string;
  title?: string;
  subtopics?: RichSubtopic[];
};

type RichSubtopic = {
  subtopic_title?: string;
  title?: string;
  nested_subtopics?: unknown;
  nested?: unknown;
};

export type ImportPreviewChapter = {
  chapterNumber: number | null;
  chapterTitle: string;
  topicsCount: number;
  subtopicsCount: number;
};

export type ImportPreviewResult = {
  valid: boolean;
  error?: string;
  detected: {
    classGrade: string | null;
    stream: string | null;
    subject: string | null;
    textbookName: string | null;
    board: string | null;
  };
  counts: {
    chapters: number;
    topics: number;
    subtopics: number;
  };
  warnings: string[];
  chapters: ImportPreviewChapter[];
  existingSubject: { id: string; subject_name: string } | null;
};

export type NormalizedImportTopic = {
  topicTitle: string;
  subtopics: { subtopicTitle: string; nestedSubtopics: string[] }[];
  status: string;
  priority: string;
  estimatedClasses: number | null;
  displayOrder: number;
};

export type NormalizedImportChapter = {
  chapterNumber: number | null;
  chapterTitle: string;
  chapterSummary: string | null;
  displayOrder: number;
  metadata: Record<string, unknown> | null;
  topics: NormalizedImportTopic[];
};

export type NormalizedImportData = {
  subjectName: string;
  stream: string | null;
  textbookName: string | null;
  board: string | null;
  academicYear: string | null;
  sourceUrl: string | null;
  importMeta: Record<string, unknown>;
  chapters: NormalizedImportChapter[];
  warnings: string[];
};

function getRichChapters(payload: SyllabusImportPayload): RichChapter[] {
  return (payload.chapters ?? []) as RichChapter[];
}

function getStructureChapters(payload: SyllabusImportPayload) {
  const appReady = payload.app_ready_syllabus;
  if (appReady?.chapters?.length) {
    return appReady.chapters;
  }
  return getRichChapters(payload).map((ch) => ({
    chapter_number: ch.chapter_number,
    chapter_title: ch.chapter_title ?? "Untitled Chapter",
    chapter_summary: ch.chapter_summary,
    topics: (ch.topics ?? []).map((t) => ({
      topic_title: t.topic_title ?? t.title ?? "Untitled Topic",
      subtopics: (t.subtopics ?? []).map((st) => ({
        subtopic_title: st.subtopic_title ?? st.title ?? "",
        nested_subtopics: [
          ...coerceNestedSubtopicLabels(st.nested_subtopics),
          ...coerceNestedSubtopicLabels(st.nested),
        ],
      })),
    })),
  }));
}

function findRichChapter(
  richChapters: RichChapter[],
  chapterNumber: number | null | undefined,
  chapterTitle: string,
): RichChapter | undefined {
  if (chapterNumber != null) {
    const byNumber = richChapters.find((c) => c.chapter_number === chapterNumber);
    if (byNumber) return byNumber;
  }
  return richChapters.find(
    (c) => c.chapter_title?.toLowerCase() === chapterTitle.toLowerCase(),
  );
}

function findRichTopic(richChapter: RichChapter | undefined, topicTitle: string) {
  return richChapter?.topics?.find((t) => {
    const title = t.topic_title ?? t.title;
    return title?.toLowerCase() === topicTitle.toLowerCase();
  });
}

function mergeSubtopics(
  appSubtopics: { subtopic_title: string; nested_subtopics?: string[] }[],
  richSubtopics: RichSubtopic[] | undefined,
  importSubtopics: boolean,
) {
  if (!importSubtopics) return [];

  if (richSubtopics?.length) {
    return richSubtopics
      .map((st) => {
        const subtopicTitle = (st.subtopic_title ?? st.title ?? "").trim();
        if (!subtopicTitle) return null;
        return {
          subtopicTitle,
          nestedSubtopics: [
            ...coerceNestedSubtopicLabels(st.nested_subtopics),
            ...coerceNestedSubtopicLabels(st.nested),
          ],
        };
      })
      .filter((item): item is { subtopicTitle: string; nestedSubtopics: string[] } =>
        Boolean(item),
      );
  }

  return appSubtopics
    .filter((st) => st.subtopic_title)
    .map((st) => ({
      subtopicTitle: st.subtopic_title,
      nestedSubtopics: st.nested_subtopics ?? [],
    }));
}

function buildChapterMetadata(richChapter: RichChapter | undefined) {
  if (!richChapter) return null;

  const metadata: Record<string, unknown> = {};
  if (richChapter.key_terms?.length) metadata.key_terms = richChapter.key_terms;
  if (richChapter.important_examples?.length) {
    metadata.important_examples = richChapter.important_examples;
  }
  if (richChapter.exercises_practice?.length) {
    metadata.exercises_practice = richChapter.exercises_practice;
  }
  if (richChapter.activity_practical_work?.length) {
    metadata.activity_practical_work = richChapter.activity_practical_work;
  }
  if (richChapter.revision_points?.length) {
    metadata.revision_points = richChapter.revision_points;
  }
  if (richChapter.teaching_usefulness) {
    metadata.teaching_usefulness = richChapter.teaching_usefulness;
  }

  return Object.keys(metadata).length > 0 ? metadata : null;
}

export function parseSyllabusImportPreview(
  payload: SyllabusImportPayload,
  existingSubject?: { id: string; subject_name: string } | null,
): ImportPreviewResult {
  const basic = payload.basic_information;
  const appReady = payload.app_ready_syllabus;
  const structureChapters = getStructureChapters(payload);
  const richChapters = getRichChapters(payload);

  const detected = {
    classGrade: basic?.class_grade ?? appReady?.class ?? null,
    stream: basic?.stream ?? appReady?.stream ?? null,
    subject: basic?.subject_name ?? appReady?.subject ?? null,
    textbookName: basic?.textbook_document_name ?? null,
    board: basic?.board_curriculum ?? null,
  };

  const warnings = [
    ...(payload.exhaustiveness_check?.manual_review_required ?? []),
    ...(payload.exhaustiveness_check?.potential_issues ?? []),
  ];

  let totalTopics = 0;
  let totalSubtopics = 0;
  const previewChapters: ImportPreviewChapter[] = [];

  for (const chapter of structureChapters) {
    const parsed = importChapterSchema.safeParse(chapter);
    if (!parsed.success) continue;

    const richChapter = findRichChapter(
      richChapters,
      parsed.data.chapter_number,
      parsed.data.chapter_title,
    );

    let chapterSubtopics = 0;
    for (const topic of parsed.data.topics) {
      const richTopic = findRichTopic(richChapter, topic.topic_title);
      const subtopics = mergeSubtopics(
        topic.subtopics,
        richTopic?.subtopics,
        true,
      );
      chapterSubtopics += countSubtopics(
        subtopics.map((s) => ({ nestedSubtopics: s.nestedSubtopics })),
      );
    }

    totalTopics += parsed.data.topics.length;
    totalSubtopics += chapterSubtopics;

    previewChapters.push({
      chapterNumber: parsed.data.chapter_number ?? null,
      chapterTitle: parsed.data.chapter_title,
      topicsCount: parsed.data.topics.length,
      subtopicsCount: chapterSubtopics,
    });
  }

  if (structureChapters.length === 0) {
    return {
      valid: false,
      error: "No chapters found in import data",
      detected,
      counts: { chapters: 0, topics: 0, subtopics: 0 },
      warnings,
      chapters: [],
      existingSubject: existingSubject ?? null,
    };
  }

  return {
    valid: true,
    detected,
    counts: {
      chapters: previewChapters.length,
      topics: totalTopics,
      subtopics: totalSubtopics,
    },
    warnings,
    chapters: previewChapters,
    existingSubject: existingSubject ?? null,
  };
}

export function buildNormalizedImportData(
  payload: SyllabusImportPayload,
  options: {
    importSubtopics?: boolean;
    setInitialStatus?: string;
  } = {},
): NormalizedImportData {
  const { importSubtopics = true, setInitialStatus = "NOT_STARTED" } = options;
  const basic = payload.basic_information;
  const appReady = payload.app_ready_syllabus;
  const structureChapters = getStructureChapters(payload);
  const richChapters = getRichChapters(payload);

  const subjectName =
    basic?.subject_name ?? appReady?.subject ?? "Imported Subject";

  const warnings = [
    ...(payload.exhaustiveness_check?.manual_review_required ?? []),
    ...(payload.exhaustiveness_check?.potential_issues ?? []),
  ];

  const chapters: NormalizedImportChapter[] = structureChapters.map(
    (chapter, chapterIndex) => {
      const parsed = importChapterSchema.parse(chapter);
      const richChapter = findRichChapter(
        richChapters,
        parsed.chapter_number,
        parsed.chapter_title,
      );

      const topics: NormalizedImportTopic[] = parsed.topics.map(
        (topic, topicIndex) => {
          const richTopic = findRichTopic(richChapter, topic.topic_title);
          const subtopics = mergeSubtopics(
            topic.subtopics,
            richTopic?.subtopics,
            importSubtopics,
          );

          return {
            topicTitle: topic.topic_title,
            subtopics,
            status: setInitialStatus,
            priority: normalizeImportPriority("Normal"),
            estimatedClasses: null,
            displayOrder: topicIndex,
          };
        },
      );

      return {
        chapterNumber: parsed.chapter_number ?? null,
        chapterTitle: parsed.chapter_title,
        chapterSummary:
          richChapter?.chapter_summary ??
          richChapter?.summary ??
          parsed.chapter_summary ??
          null,
        displayOrder: parsed.chapter_number ?? chapterIndex,
        metadata: buildChapterMetadata(richChapter),
        topics,
      };
    },
  );

  return {
    subjectName,
    stream: basic?.stream ?? appReady?.stream ?? null,
    textbookName: basic?.textbook_document_name ?? null,
    board: basic?.board_curriculum ?? null,
    academicYear: basic?.academic_year_version ?? null,
    sourceUrl: basic?.source_url ?? null,
    importMeta: {
      basic_information: basic,
      exhaustiveness_check: payload.exhaustiveness_check ?? null,
      imported_at: new Date().toISOString(),
    },
    chapters,
    warnings,
  };
}
