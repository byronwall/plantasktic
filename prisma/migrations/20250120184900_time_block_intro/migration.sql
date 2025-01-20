-- CreateTable
CREATE TABLE "TimeBlock" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "TimeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeBlockTask" (
    "id" TEXT NOT NULL,
    "timeBlockId" TEXT NOT NULL,
    "taskId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeBlockTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeBlock_workspaceId_idx" ON "TimeBlock"("workspaceId");

-- CreateIndex
CREATE INDEX "TimeBlockTask_timeBlockId_idx" ON "TimeBlockTask"("timeBlockId");

-- CreateIndex
CREATE INDEX "TimeBlockTask_taskId_idx" ON "TimeBlockTask"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeBlockTask_timeBlockId_taskId_key" ON "TimeBlockTask"("timeBlockId", "taskId");

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlockTask" ADD CONSTRAINT "TimeBlockTask_timeBlockId_fkey" FOREIGN KEY ("timeBlockId") REFERENCES "TimeBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlockTask" ADD CONSTRAINT "TimeBlockTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;
