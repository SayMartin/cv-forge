CREATE TABLE "cv" (
  "id"            TEXT        NOT NULL,
  "name"          TEXT        NOT NULL,
  "userId"        TEXT        NOT NULL,
  "profileId"     TEXT,
  "experienceIds" TEXT[]      NOT NULL DEFAULT '{}',
  "educationIds"  TEXT[]      NOT NULL DEFAULT '{}',
  "skillIds"      TEXT[]      NOT NULL DEFAULT '{}',
  "projectIds"    TEXT[]      NOT NULL DEFAULT '{}',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "cv_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cv_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
