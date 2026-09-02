-- Template documents: Horizon-style JSON page templates (ordered section
-- instances + settings + nested block instances). One row per template type.
-- The homepage is templateType "index". Existing SiteSection/Block rows are
-- converted lazily on first read by lib/theme/document.ts; legacy rows are
-- retained as a rollback record.

-- CreateTable
CREATE TABLE "TemplateDocument" (
    "id" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateDocument_templateType_key" ON "TemplateDocument"("templateType");
