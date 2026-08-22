-- Better Auth 1.7 adds `issuer` to `account` and matches on it during credential
-- sign-in (api/routes/sign-in: providerId === 'credential' && issuer === 'local:credential'
-- && accountId === user.id). A row left without the right value does not error --
-- it fails login as INVALID_EMAIL_OR_PASSWORD. Existing rows must therefore be
-- backfilled, not merely given a column.
--
-- Values follow createLocalAccountIssuer / createOAuthAccountIssuer in
-- @better-auth/core/db: 'local:<providerId>' for local providers and
-- 'local:oauth:<providerId>' for OAuth providers that declare no issuer of their
-- own -- which includes the built-in Google provider (it sets no accountIssuer,
-- so it does NOT get https://accounts.google.com). Both encode the provider id
-- with encodeURIComponent, which is the identity for the ids in use here.
--
-- The only local provider in this deployment is 'credential'; every other row is
-- OAuth. Should a future local provider (siwe, phone-number) ever be added, its
-- rows would need 'local:<id>' instead and this rule would not cover them.
--
-- Column stays nullable on purpose -- see the note on Account.issuer in
-- schema.prisma: NOT NULL would break account creation under a rollback to the
-- previous image, which is the one moment it matters.

-- AlterTable
ALTER TABLE "account" ADD COLUMN     "issuer" TEXT;

-- Backfill
UPDATE "account" SET "issuer" = 'local:credential'
  WHERE "providerId" = 'credential';

UPDATE "account" SET "issuer" = 'local:oauth:' || "providerId"
  WHERE "providerId" <> 'credential';
