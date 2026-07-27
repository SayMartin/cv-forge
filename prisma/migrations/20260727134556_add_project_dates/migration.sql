-- AlterTable
ALTER TABLE "project" ADD COLUMN     "startDate" TEXT,
ADD COLUMN     "endDate" TEXT,
ADD COLUMN     "current" BOOLEAN NOT NULL DEFAULT false;
