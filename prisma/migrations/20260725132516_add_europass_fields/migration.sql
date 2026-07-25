-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "drivingLicense" TEXT,
ADD COLUMN     "nationality" TEXT;

-- AlterTable
ALTER TABLE "skill" ADD COLUMN     "cefrLevel" TEXT;
