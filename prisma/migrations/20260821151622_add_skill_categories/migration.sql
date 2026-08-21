-- Skill categories become user-owned rows instead of a hardcoded string enum.
--
-- Structure first, then a ONE-TIME best-effort backfill. The old `skill.category`
-- string is renamed to `legacyCategory` rather than dropped, so the backfill's
-- guesses stay auditable against the original values. Drop that column in a later
-- migration once the result has been reviewed.

-- ─── Structure ───────────────────────────────────────────────────────────────

CREATE TABLE "skill_category" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'normal',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "skill_category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "skill_category_userId_name_key" ON "skill_category"("userId", "name");

ALTER TABLE "skill_category" ADD CONSTRAINT "skill_category_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "skill" RENAME COLUMN "category" TO "legacyCategory";

ALTER TABLE "skill" ADD COLUMN "categoryId" TEXT;

-- SET NULL, not RESTRICT: RESTRICT would abort `DELETE FROM "user"` when the
-- cascade reaches skill_category before skill, breaking account erasure. The
-- "can't delete a non-empty category" rule is enforced in the API instead.
ALTER TABLE "skill" ADD CONSTRAINT "skill_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "skill_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── One-time backfill ───────────────────────────────────────────────────────

-- Default categories for every existing user. Ids are derived from (userId, name)
-- rather than random so this statement is idempotent and needs no uuid extension.
INSERT INTO "skill_category" ("id", "userId", "name", "kind", "order", "createdAt", "updatedAt")
SELECT 'skc_' || md5(u."id" || '|' || d."name"), u."id", d."name", d."kind", d."order", NOW(), NOW()
FROM "user" u
CROSS JOIN (VALUES
    ('Programming',     'normal',   0),
    ('Backend',         'normal',   1),
    ('Frontend',        'normal',   2),
    ('DevOps & Cloud',  'normal',   3),
    ('Tools & methods', 'normal',   4),
    ('Language',        'language', 5),
    ('Other',           'normal',   6)
) AS d("name", "kind", "order")
ON CONFLICT ("userId", "name") DO NOTHING;

-- Spoken languages move by their old category, not by name: "Language" was already
-- reserved for them, and they carry the CEFR levels the Europass table renders.
UPDATE "skill" s
SET "categoryId" = c."id"
FROM "skill_category" c
WHERE c."userId" = s."userId"
  AND c."kind" = 'language'
  AND lower(s."legacyCategory") = 'language';

-- Everything else is mapped by skill NAME, because the old values (Framework,
-- Tool, Platform) do not translate onto the new groups — that mismatch is what
-- prompted the change. Unrecognised names land in "Other" for manual sorting.
UPDATE "skill" s
SET "categoryId" = c."id"
FROM "skill_category" c
WHERE c."userId" = s."userId"
  AND s."categoryId" IS NULL
  AND c."name" = CASE
    WHEN lower(s."name") IN (
        'c#', 'typescript', 'javascript', 'kotlin', 'java', 'swift', 'dart',
        'python', 'sql', 'c', 'c++', 'go', 'rust', 'php', 'ruby'
    ) THEN 'Programming'
    WHEN lower(s."name") IN (
        '.net', 'entity framework', 'linq', 'node.js', 'nodejs', 'prisma',
        'postgresql', 'postgres', 'supabase', 'rest', 'mvvm', 'drizzle orm',
        'better auth', 'sqlite', 'mongodb', 'graphql'
    ) THEN 'Backend'
    WHEN lower(s."name") IN (
        'react', 'next.js', 'nextjs', 'react native', 'expo', 'flutter',
        'tailwind', 'tailwind css', 'html', 'css', 'html/css', 'bootstrap',
        'android', 'ios', 'watchos', 'tvos', 'tiptap'
    ) THEN 'Frontend'
    WHEN lower(s."name") IN (
        'docker', 'nginx', 'github actions', 'cloudflare', 'cloudflare workers',
        'cloudflare r2', 'cloudflare d1', 'cloudflare tunnel', 'azure', 'linux',
        'github', 'ci/cd', 'watchtower', 'portainer', 'opennext'
    ) THEN 'DevOps & Cloud'
    WHEN lower(s."name") IN (
        'git', 'vs code', 'visual studio code', 'android studio', 'xcode',
        'figma', 'sketch', 'jira', 'clickup', 'scrum', 'kanban', 'scrum/kanban',
        'claude code', 'agile'
    ) THEN 'Tools & methods'
    ELSE 'Other'
  END;
