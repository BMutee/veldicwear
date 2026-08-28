-- CreateExtensionApiKey
-- Nullable columns (lastUsedAt, name) and a boolean default add no backfill
-- cost; the table starts empty, so this is an instant, non-destructive DDL.
CREATE TABLE "ExtensionApiKey" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExtensionApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionApiKey_keyHash_key" ON "ExtensionApiKey"("keyHash");