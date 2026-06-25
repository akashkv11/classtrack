"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import Alert from "@/components/ui/alert";
import FormField, { TextInput } from "@/components/ui/form-field";
import { FieldErrors, parseInput, unlockSchema } from "@/lib/validation";

export default function PasswordGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const parsed = parseInput(unlockSchema, { password });
    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.error);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error ?? "Invalid password. Please try again.");
        if (payload.field_errors) {
          setFieldErrors(payload.field_errors);
        }
        return;
      }

      router.push("/today");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <Card padding="lg" className="w-full max-w-md rounded-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">ClassTrack</h1>
          <p className="mt-2 text-sm text-slate-600">
            Simple attendance tracking for every class.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Password" error={fieldErrors.password}>
            <TextInput
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter app password"
              error={!!fieldErrors.password}
              autoFocus
            />
          </FormField>

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" disabled={loading} className="w-full py-2.5">
            {loading ? "Unlocking..." : "Unlock"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
