"use client";

import Link from "next/link";
import { useState } from "react";
import AttendanceAlertCard from "@/components/attendance-alerts/attendance-alert-card";
import AttendanceAlertsSummary from "@/components/attendance-alerts/attendance-alerts-summary";
import Alert from "@/components/ui/alert";
import FormField, { SelectInput, TextInput } from "@/components/ui/form-field";
import LoadingState, { EmptyState } from "@/components/ui/loading-state";
import {
  ALERT_STATUSES,
  ALERT_STATUS_LABELS,
  ALERT_TYPES,
  ALERT_TYPE_LABELS,
} from "@/lib/attendance-alerts/status";
import type {
  AlertStatus,
  AlertType,
  AttendanceAlertsListResponse,
} from "@/lib/types/attendance-alert";
import { useClientEffect } from "@/lib/use-client-effect";
import { monthSchema, parseInput } from "@/lib/validation";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type AttendanceAlertsClientProps = {
  classId: string;
};

export default function AttendanceAlertsClient({ classId }: AttendanceAlertsClientProps) {
  const [month, setMonth] = useState(currentMonth());
  const [alertType, setAlertType] = useState<AlertType | "ALL">("ALL");
  const [status, setStatus] = useState<AlertStatus | "ALL">("OPEN");
  const [data, setData] = useState<AttendanceAlertsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthError, setMonthError] = useState("");
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  useClientEffect(async (signal) => {
    const monthParsed = parseInput(monthSchema, month);
    if (!monthParsed.success) {
      setMonthError(monthParsed.error);
      setLoading(false);
      return;
    }

    setMonthError("");
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      month,
      alert_type: alertType,
      status,
    });

    const res = await fetch(`/api/classes/${classId}/attendance-alerts?${params}`, {
      signal,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? "Failed to load attendance alerts.");
      setData(null);
      setLoading(false);
      return;
    }

    setData(await res.json());
    setLoading(false);
  }, [classId, month, alertType, status]);

  async function handleStatusChange(
    alertKey: string,
    studentId: string,
    alertTypeValue: AlertType,
    newStatus: AlertStatus,
  ) {
    setUpdatingKey(alertKey);
    setError("");

    try {
      const res = await fetch(`/api/classes/${classId}/attendance-alerts/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_key: alertKey,
          student_id: studentId,
          alert_type: alertTypeValue,
          month,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to update alert status");
      }

      const params = new URLSearchParams({
        month,
        alert_type: alertType,
        status,
      });
      const refreshRes = await fetch(`/api/classes/${classId}/attendance-alerts?${params}`);
      if (refreshRes.ok) {
        setData(await refreshRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update alert status");
    } finally {
      setUpdatingKey(null);
    }
  }

  function handleMonthChange(value: string) {
    setMonth(value);
    const parsed = parseInput(monthSchema, value);
    setMonthError(parsed.success ? "" : parsed.error);
  }

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Month" error={monthError}>
          <TextInput
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            error={!!monthError}
          />
        </FormField>

        <FormField label="Alert Type">
          <SelectInput
            value={alertType}
            onChange={(e) => setAlertType(e.target.value as AlertType | "ALL")}
          >
            <option value="ALL">All</option>
            {ALERT_TYPES.map((type) => (
              <option key={type} value={type}>
                {ALERT_TYPE_LABELS[type]}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="Status">
          <SelectInput
            value={status}
            onChange={(e) => setStatus(e.target.value as AlertStatus | "ALL")}
          >
            <option value="ALL">All</option>
            {ALERT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {ALERT_STATUS_LABELS[item]}
              </option>
            ))}
          </SelectInput>
        </FormField>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingState />
      ) : data ? (
        <>
          <AttendanceAlertsSummary summary={data.summary} month={data.month} />

          {data.working_days === 0 ? (
            <EmptyState message="No attendance marked for this month yet. Mark attendance to generate alerts." />
          ) : data.alerts.length === 0 ? (
            <EmptyState message="No alerts match the selected filters." />
          ) : (
            <div>
              {data.alerts.map((alert) => (
                <AttendanceAlertCard
                  key={alert.alert_key}
                  classId={classId}
                  alert={alert}
                  updating={updatingKey === alert.alert_key}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}

          <p className="mt-6 text-sm text-slate-600">
            Need to follow up?{" "}
            <Link
              href="/student-notes"
              className="font-medium text-blue-700 hover:text-blue-800"
            >
              Student Notes
            </Link>{" "}
            and{" "}
            <Link
              href="/parent-communication"
              className="font-medium text-blue-700 hover:text-blue-800"
            >
              Parent Communication
            </Link>{" "}
            are available from each student profile.
          </p>
        </>
      ) : null}
    </>
  );
}
