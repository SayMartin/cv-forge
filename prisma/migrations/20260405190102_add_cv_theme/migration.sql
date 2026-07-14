-- AlterTable
ALTER TABLE "cv" ADD COLUMN     "themeId" TEXT;

-- CreateTable
CREATE TABLE "cv_theme" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sidebarColor" TEXT NOT NULL DEFAULT '#2d2d2d',
    "accentColor" TEXT NOT NULL DEFAULT '#c9a84c',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_theme_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cv" ADD CONSTRAINT "cv_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "cv_theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_theme" ADD CONSTRAINT "cv_theme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
