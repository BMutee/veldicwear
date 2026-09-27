-- Admin -> Messages as a real messenger.
--
--   1. MessageThread   - one conversation per customer, keyed by email
--   2. MessageNote     - internal notes, never emailed to the customer
--   3. CannedResponse  - saved replies for the composer
--   4. threadId on messages/replies, plus a backfill of every existing row
--
-- The backfill is the point of this migration. ContactMessage had no notion of
-- a conversation, so a customer who wrote three times about one issue was three
-- unrelated inbox rows with no shared history. Each distinct lowercased email
-- gets a thread, keyed deterministically as 'thread_' || md5(email) so re-running
-- is idempotent, and every message is attached to it.
--
-- messageId on ContactMessageReply becomes optional (the column is NOT NULL
-- today, so it is dropped and re-added): a follow-up sent days later belongs to
-- the thread without answering any one specific message.
--
-- IF NOT EXISTS / guarded constraints keep this safe on databases where part of
-- it was already applied with `prisma db push` (same posture as
-- 20260924000000_add_variant_source_color).

-- CreateTable
CREATE TABLE IF NOT EXISTS "MessageThread" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastReplyAt" TIMESTAMP(3),
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MessageNote" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "adminId" TEXT,
    "adminName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CannedResponse" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CannedResponse_pkey" PRIMARY KEY ("id")
);

-- AlterTable: the conversation pointers
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "threadId" TEXT;
ALTER TABLE "ContactMessageReply" ADD COLUMN IF NOT EXISTS "threadId" TEXT;

-- CreateIndex
--
-- MessageThread_email_key must exist BEFORE the backfill below: it is the
-- arbiter for that INSERT ... ON CONFLICT ("email") DO NOTHING.
CREATE UNIQUE INDEX IF NOT EXISTS "MessageThread_email_key" ON "MessageThread"("email");
CREATE INDEX IF NOT EXISTS "MessageThread_status_lastMessageAt_idx" ON "MessageThread"("status", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "MessageThread_lastMessageAt_idx" ON "MessageThread"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "MessageNote_threadId_createdAt_idx" ON "MessageNote"("threadId", "createdAt");
CREATE INDEX IF NOT EXISTS "ContactMessage_threadId_createdAt_idx" ON "ContactMessage"("threadId", "createdAt");
CREATE INDEX IF NOT EXISTS "ContactMessageReply_threadId_createdAt_idx" ON "ContactMessageReply"("threadId", "createdAt");


-- Backfill step 1: one thread per distinct lowercased email, carrying the
-- details of that person's most recent message. DISTINCT ON + ORDER BY picks
-- the newest row per email without a self-join.
INSERT INTO "MessageThread" (
    "id", "email", "customerName", "subject", "status", "unreadCount",
    "lastMessageAt", "createdAt", "updatedAt"
)
SELECT DISTINCT ON (LOWER(m."email"))
    'thread_' || md5(LOWER(m."email")),
    LOWER(m."email"),
    m."name",
    m."subject",
    'open',
    0,
    m."createdAt",
    m."createdAt",
    m."createdAt"
FROM "ContactMessage" m
ORDER BY LOWER(m."email"), m."createdAt" DESC
ON CONFLICT ("email") DO NOTHING;

-- Backfill step 2: attach every message to its thread.
UPDATE "ContactMessage" m
SET "threadId" = 'thread_' || md5(LOWER(m."email"))
WHERE m."threadId" IS NULL;

-- Backfill step 3: replies recorded before this migration hang off a
-- ContactMessage, so inherit the thread from it.
--
-- This MUST run before the lastReplyAt step below, which reads threadId off
-- ContactMessageReply -- with the old ordering it saw zero rows and left every
-- already-answered thread looking unanswered.
UPDATE "ContactMessageReply" r
SET "threadId" = m."threadId"
FROM "ContactMessage" m
WHERE m."id" = r."messageId" AND r."threadId" IS NULL;

-- Backfill step 4: a thread that already has a reply is a "replied" thread.
UPDATE "MessageThread" t
SET "lastReplyAt" = r."lastReplyAt"
FROM (
    SELECT "threadId", MAX("createdAt") AS "lastReplyAt"
    FROM "ContactMessageReply"
    WHERE "threadId" IS NOT NULL
    GROUP BY "threadId"
) r
WHERE t."id" = r."threadId" AND t."lastReplyAt" IS NULL;

-- Backfill step 5: messages an admin never opened stay unread.
UPDATE "MessageThread" t
SET "unreadCount" = c."unread"
FROM (
    SELECT "threadId", COUNT(*)::int AS "unread"
    FROM "ContactMessage"
    WHERE "read" = false
    GROUP BY "threadId"
) c
WHERE t."id" = c."threadId";

-- Relax messageId to nullable: a thread-level reply need not answer one message.
ALTER TABLE "ContactMessageReply" DROP COLUMN IF EXISTS "messageId";
ALTER TABLE "ContactMessageReply" ADD COLUMN IF NOT EXISTS "messageId" TEXT;

-- AddForeignKey (guarded so re-running on a migrated database is a no-op)
DO $$ BEGIN
    ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_threadId_fkey"
        FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ContactMessageReply" ADD CONSTRAINT "ContactMessageReply_threadId_fkey"
        FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MessageNote" ADD CONSTRAINT "MessageNote_threadId_fkey"
        FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Restore the reply -> message foreign key, now nullable.
DO $$ BEGIN
    ALTER TABLE "ContactMessageReply"
        ADD CONSTRAINT "ContactMessageReply_messageId_fkey"
        FOREIGN KEY ("messageId") REFERENCES "ContactMessage"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
