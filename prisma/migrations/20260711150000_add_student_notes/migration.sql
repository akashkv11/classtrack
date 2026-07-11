-- CreateTable
CREATE TABLE "student_notes" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "note_date" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "note_text" TEXT NOT NULL,
    "follow_up_needed" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "student_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_notes_student_id_note_date_idx" ON "student_notes"("student_id", "note_date");

-- AddForeignKey
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
