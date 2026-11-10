ALTER TABLE "assessments"
  ADD COLUMN "share_token" TEXT,
  ADD COLUMN "sharing_enabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "assessments_share_token_key" ON "assessments"("share_token");
