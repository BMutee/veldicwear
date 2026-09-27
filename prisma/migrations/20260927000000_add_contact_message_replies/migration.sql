-- Admin → Messages: answer a customer from inside the inbox instead of
-- bouncing out to a mail client. ContactMessage gains repliedAt (drives the
-- "Replied" badge in the list) and a child ContactMessageReply table holds the
-- thread, so the next person to open the message can see it was answered.
--
-- IF NOT EXISTS / the guarded constraint keep this safe on databases where the
-- change was already applied with `prisma db push` (same posture as
-- 20260924000000_add_variant_source_color).

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContactMessageReply" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "adminId" TEXT,
    "adminName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessageReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactMessageReply_messageId_createdAt_idx"
    ON "ContactMessageReply"("messageId", "createdAt");

-- AddForeignKey (guarded so re-running on an already-migrated database is a no-op)
DO $$ BEGIN
    ALTER TABLE "ContactMessageReply"
        ADD CONSTRAINT "ContactMessageReply_messageId_fkey"
        FOREIGN KEY ("messageId") REFERENCES "ContactMessage"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;