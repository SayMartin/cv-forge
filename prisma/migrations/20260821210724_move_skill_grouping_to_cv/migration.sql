-- Skill composition moves from the skill to the CV.
--
-- A skill no longer owns a category or a display order; each CV decides which
-- categories it shows, in what order, which skills sit in each, and in what order.
-- Two CVs can therefore arrange the same library differently.
--
-- `skill.categoryId` and `skill.order` are NOT dropped here. The backfill below
-- reads them, and keeping them for one release leaves the result auditable. Drop
-- them, together with `legacyCategory`, in a follow-up migration.

-- AlterTable
ALTER TABLE "cv" ADD COLUMN "skillGroups" JSONB;

-- ─── One-time backfill ───────────────────────────────────────────────────────

-- Rebuild each CV's grouping from the categories its currently-selected skills
-- happen to sit in. Categories keep their existing order; skills inside a group
-- keep their existing `order`, falling back to name.
--
-- Only categories that actually hold one of the CV's selected skills are included:
-- an empty group would show as a heading with nothing under it.
UPDATE "cv" c
SET "skillGroups" = COALESCE(
  (
    SELECT jsonb_agg(sub."group" ORDER BY sub."categoryOrder", sub."categoryName")
    FROM (
      SELECT
        jsonb_build_object(
          'categoryId', sc."id",
          'skillIds', jsonb_agg(s."id" ORDER BY s."order", s."name")
        ) AS "group",
        sc."order" AS "categoryOrder",
        sc."name"  AS "categoryName"
      FROM "skill_category" sc
      JOIN "skill" s ON s."categoryId" = sc."id"
      WHERE sc."userId" = c."userId"
        AND s."id" = ANY(c."skillIds")
      GROUP BY sc."id", sc."order", sc."name"
    ) sub
  ),
  '[]'::jsonb
);

-- Enforce the invariant the application relies on from here on: a skill can only be
-- selected if it is placed in a group. Any selected-but-unplaced id is dropped now
-- so no CV starts out already violating it.
UPDATE "cv" c
SET "skillIds" = COALESCE(
  (
    SELECT array_agg(id ORDER BY ord)
    FROM (
      SELECT id, ord
      FROM unnest(c."skillIds") WITH ORDINALITY AS t(id, ord)
      WHERE id IN (
        SELECT jsonb_array_elements_text(g->'skillIds')
        FROM jsonb_array_elements(c."skillGroups") g
      )
    ) kept
  ),
  ARRAY[]::text[]
)
WHERE c."skillGroups" IS NOT NULL;
