/*
  Warnings:

  - Made the column `workspaceId` on table `Goal` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_workspaceId_fkey";

-- AlterTable
ALTER TABLE "Goal" ALTER COLUMN "workspaceId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
