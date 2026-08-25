-- Add the timestamp required by getActiveAnnouncement's recency ordering.
ALTER TABLE "Announcement"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Announcement"
ALTER COLUMN "updatedAt" DROP DEFAULT;
