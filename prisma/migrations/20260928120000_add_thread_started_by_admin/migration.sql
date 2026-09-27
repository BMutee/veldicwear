-- Lets an admin START a conversation from the composer, and gives those threads
-- a "Sent" folder to live in. Without it a proactive email has nowhere to show
-- up in the mailbox, because every thread so far began with a customer writing
-- in.
--
-- Additive and idempotent: a plain nullable-safe column with a default, so
-- every existing row becomes startedByAdmin = false (i.e. customer-initiated).

ALTER TABLE "MessageThread"
    ADD COLUMN IF NOT EXISTS "startedByAdmin" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "MessageThread_startedByAdmin_lastMessageAt_idx"
    ON "MessageThread"("startedByAdmin", "lastMessageAt");
