-- CreateTable
CREATE TABLE "import_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pages" INTEGER NOT NULL,
    "inTokens" INTEGER,
    "outTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_log_userId_createdAt_idx" ON "import_log"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "import_log" ADD CONSTRAINT "import_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
