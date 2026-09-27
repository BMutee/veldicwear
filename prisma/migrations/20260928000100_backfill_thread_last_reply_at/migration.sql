-- Corrective follow-up to 20260928000000_add_message_threading.
--
-- That migration set MessageThread.lastReplyAt by reading threadId off
-- ContactMessageReply, but it attached replies to their thread a few statements
-- LATER -- so the read matched zero rows and every already-answered thread was
-- left looking unanswered. The parent migration has been reordered for fresh
-- databases; this one repairs the databases that already ran the old order.
--
-- Narrow and idempotent: only fills lastReplyAt where it is still NULL and the
-- thread genuinely has a reply, so re-running changes nothing.

UPDATE "MessageThread" t
SET "lastReplyAt" = r."lastReplyAt"
FROM (
    SELECT "threadId", MAX("createdAt") AS "lastReplyAt"
    FROM "ContactMessageReply"
    WHERE "threadId" IS NOT NULL
    GROUP BY "threadId"
) r
WHERE t."id" = r."threadId" AND t."lastReplyAt" IS NULL;
