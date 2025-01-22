-- CreateTable
CREATE TABLE "DayMetadata" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "DayMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DayMetadata_workspaceId_idx" ON "DayMetadata"("workspaceId");

-- CreateIndex
CREATE INDEX "DayMetadata_date_idx" ON "DayMetadata"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DayMetadata_workspaceId_date_key_key" ON "DayMetadata"("workspaceId", "date", "key");

-- AddForeignKey
ALTER TABLE "DayMetadata" ADD CONSTRAINT "DayMetadata_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
