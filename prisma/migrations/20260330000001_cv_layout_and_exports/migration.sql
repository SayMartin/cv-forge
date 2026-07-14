-- Add layoutId to cv table
ALTER TABLE "cv" ADD COLUMN "layoutId" TEXT NOT NULL DEFAULT 'default';

-- Create cv_export table
CREATE TABLE "cv_export" (
  "id"        TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "cvId"      TEXT,
  "layoutId"  TEXT         NOT NULL,
  "pdfUrl"    TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "cv_export_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cv_export_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cv_export_cvId_fkey"
    FOREIGN KEY ("cvId") REFERENCES "cv"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);
