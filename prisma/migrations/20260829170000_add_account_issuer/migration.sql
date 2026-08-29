-- AlterTable
ALTER TABLE "Account" ADD COLUMN "issuer" TEXT;

-- Backfill: Better Auth (>=1.2.x) credential sign-in requires
-- account.issuer === 'local:credential' (createLocalAccountIssuer). Existing
-- rows created before the column existed have issuer = NULL, which would make
-- every email/password login fail with "User not found".
UPDATE "Account"
SET "issuer" = 'local:credential'
WHERE "providerId" = 'credential' AND "issuer" IS NULL;