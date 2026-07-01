"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SyllabusImportPreview from "@/components/syllabus/syllabus-import-preview";
import type { SyllabusImportPreviewData } from "@/lib/types/syllabus";
import { useClass } from "@/components/classes/class-provider";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import FormField, { SelectInput, TextInput } from "@/components/ui/form-field";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { inputClassName } from "@/lib/validation";

type ImportMethod = "file" | "paste";

export default function SyllabusImportPage() {
  const params = useParams<{ classId: string }>();
  const router = useRouter();
  const { displayName } = useClass();

  const [method, setMethod] = useState<ImportMethod>("file");
  const [subjectName, setSubjectName] = useState("Computer Applications");
  const [jsonText, setJsonText] = useState("");
  const [preview, setPreview] = useState<SyllabusImportPreviewData | null>(null);
  const [rawPayload, setRawPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function parseJsonInput(): Promise<unknown> {
    if (method === "paste") {
      return JSON.parse(jsonText);
    }

    const input = document.getElementById("syllabus-json-file") as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) throw new Error("Choose a JSON file first");

    const text = await file.text();
    return JSON.parse(text);
  }

  async function handlePreview() {
    setError("");
    setLoading(true);
    setPreview(null);

    try {
      const json = await parseJsonInput();
      setRawPayload(json);

      const res = await fetch(`/api/classes/${params.classId}/syllabus/import/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to preview import");
      }

      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON file");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(importAsNewCopy: boolean) {
    if (!rawPayload) return;

    setConfirming(true);
    setError("");

    try {
      const res = await fetch(`/api/classes/${params.classId}/syllabus/import/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: rawPayload,
          options: {
            importAsNewCopy,
            importSubtopics: true,
            setInitialStatus: "NOT_STARTED",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to import syllabus");
      }

      router.push(`/classes/${params.classId}/syllabus`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import syllabus");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Import Syllabus"
        subtitle={displayName}
        backHref={`/classes/${params.classId}/syllabus`}
        backLabel="← Back to Class Syllabus"
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!preview ? (
        <Card>
          <div className="space-y-4">
            <FormField label="Class">
              <TextInput value={displayName} readOnly disabled />
            </FormField>

            <FormField label="Subject">
              <TextInput
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </FormField>

            <FormField label="Import Method">
              <SelectInput
                value={method}
                onChange={(e) => setMethod(e.target.value as ImportMethod)}
              >
                <option value="file">Upload JSON file</option>
                <option value="paste">Paste JSON</option>
              </SelectInput>
            </FormField>

            {method === "file" ? (
              <FormField label="JSON File">
                <input
                  id="syllabus-json-file"
                  type="file"
                  accept=".json,application/json"
                  className={inputClassName()}
                />
              </FormField>
            ) : (
              <FormField label="JSON Content">
                <textarea
                  className={inputClassName()}
                  rows={12}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="Paste syllabus JSON here"
                />
              </FormField>
            )}

            <Button variant="primary" onClick={handlePreview} disabled={loading}>
              {loading ? "Previewing…" : "Preview Import"}
            </Button>
          </div>
        </Card>
      ) : (
        <SyllabusImportPreview
          preview={preview}
          confirming={confirming}
          onConfirm={handleConfirm}
          onCancel={() => setPreview(null)}
        />
      )}
    </PageContainer>
  );
}
