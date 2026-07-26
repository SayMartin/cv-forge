-- Backfill NULL values left over from migrations that added these columns
-- without a NOT NULL DEFAULT, then enforce the constraint going forward.
UPDATE "cv" SET "otherIds" = '{}' WHERE "otherIds" IS NULL;
UPDATE "cv" SET "sectionOrder" = '{}' WHERE "sectionOrder" IS NULL;

ALTER TABLE "cv" ALTER COLUMN "otherIds" SET NOT NULL,
                 ALTER COLUMN "otherIds" SET DEFAULT '{}';
ALTER TABLE "cv" ALTER COLUMN "sectionOrder" SET NOT NULL,
                 ALTER COLUMN "sectionOrder" SET DEFAULT '{}';
