-- CreateTable
CREATE TABLE "attendance_alert_statuses" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "alert_key" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "attendance_alert_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_alert_statuses_class_id_month_idx" ON "attendance_alert_statuses"("class_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_alert_statuses_class_id_alert_key_key" ON "attendance_alert_statuses"("class_id", "alert_key");

-- AddForeignKey
ALTER TABLE "attendance_alert_statuses" ADD CONSTRAINT "attendance_alert_statuses_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_alert_statuses" ADD CONSTRAINT "attendance_alert_statuses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
