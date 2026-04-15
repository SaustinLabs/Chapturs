-- CreateTable
CREATE TABLE "section_edit_suggestions" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "proposedById" TEXT NOT NULL,
    "proposedContent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "authorComment" TEXT,
    "proposerComment" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_edit_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "section_edit_suggestions_workId_idx" ON "section_edit_suggestions"("workId");

-- CreateIndex
CREATE INDEX "section_edit_suggestions_sectionId_idx" ON "section_edit_suggestions"("sectionId");

-- CreateIndex
CREATE INDEX "section_edit_suggestions_status_idx" ON "section_edit_suggestions"("status");

-- CreateIndex
CREATE INDEX "section_edit_suggestions_proposedById_idx" ON "section_edit_suggestions"("proposedById");

-- AddForeignKey
ALTER TABLE "section_edit_suggestions" ADD CONSTRAINT "section_edit_suggestions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_edit_suggestions" ADD CONSTRAINT "section_edit_suggestions_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_edit_suggestions" ADD CONSTRAINT "section_edit_suggestions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
