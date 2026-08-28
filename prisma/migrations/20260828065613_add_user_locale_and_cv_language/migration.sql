-- AlterTable
ALTER TABLE "cv" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "locale" TEXT;
