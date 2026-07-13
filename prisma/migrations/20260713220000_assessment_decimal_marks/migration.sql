-- AlterTable
ALTER TABLE "assessments" ALTER COLUMN "max_marks" TYPE DECIMAL(7,2) USING "max_marks"::decimal;

-- AlterTable
ALTER TABLE "assessment_marks" ALTER COLUMN "marks_obtained" TYPE DECIMAL(7,2) USING "marks_obtained"::decimal;
