-- AlterTable
ALTER TABLE "timetable_entries" ADD COLUMN IF NOT EXISTS "schedule_exceptions" JSONB NOT NULL DEFAULT '[]';

-- Drop per-day schedules if that migration was applied
ALTER TABLE "timetable_entries" DROP COLUMN IF EXISTS "day_schedules";
