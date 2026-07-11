-- CreateTable
CREATE TABLE "parent_communications" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "student_note_id" UUID,
    "communication_date" DATE NOT NULL,
    "communication_type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "follow_up_needed" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "parent_communications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parent_communications_student_id_communication_date_idx" ON "parent_communications"("student_id", "communication_date");

-- AddForeignKey
ALTER TABLE "parent_communications" ADD CONSTRAINT "parent_communications_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_communications" ADD CONSTRAINT "parent_communications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_communications" ADD CONSTRAINT "parent_communications_student_note_id_fkey" FOREIGN KEY ("student_note_id") REFERENCES "student_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
