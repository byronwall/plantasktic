import { FolderInput, Tag, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useSelectedTasksStore } from "~/stores/useSelectedTasksStore";
import { api } from "~/trpc/react";

import { ComboBox } from "./ComboBox";
import { ProjectSelector } from "./ProjectSelector";

type TaskSelectionActionsProps = {
  totalTasks: number;
};

export const TaskSelectionActions = ({
  totalTasks,
}: TaskSelectionActionsProps) => {
  const { selectedTasks, toggleAllTasks, clearSelection } =
    useSelectedTasksStore();

  const { data: categories = [] } = api.task.getCategories.useQuery();

  const bulkDeleteTasksMutation = api.task.bulkDeleteTasks.useMutation();
  const bulkUpdateTaskCategoryMutation =
    api.task.bulkUpdateTaskCategory.useMutation();
  const bulkMoveTasksToProjectMutation =
    api.task.bulkMoveTasksToProject.useMutation();

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedTasks.size} tasks?`,
      )
    ) {
      await bulkDeleteTasksMutation.mutateAsync({
        taskIds: Array.from(selectedTasks),
      });
      clearSelection();
    }
  };

  const handleBulkCategoryUpdate = async (category: string) => {
    await bulkUpdateTaskCategoryMutation.mutateAsync({
      taskIds: Array.from(selectedTasks),
      category,
    });
    clearSelection();
  };

  const handleBulkMoveToProject = async (projectId: string | null) => {
    await bulkMoveTasksToProjectMutation.mutateAsync({
      taskIds: Array.from(selectedTasks),
      projectId,
    });
    clearSelection();
  };

  return (
    <>
      <Label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          className="h-5 w-5"
          checked={selectedTasks.size === totalTasks && totalTasks > 0}
          onCheckedChange={() => toggleAllTasks()}
        />
        <span className="select-none text-sm">Select All</span>
      </Label>
      {selectedTasks.size > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1">
          <span className="text-sm">{selectedTasks.size} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Tag className="mr-1 h-4 w-4" />
                Set Category
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <ComboBox
                options={categories}
                value=""
                onChange={(value) => handleBulkCategoryUpdate(value ?? "")}
                placeholder="Select category..."
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderInput className="mr-1 h-4 w-4" />
                Move to Project
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <ProjectSelector onProjectSelect={handleBulkMoveToProject} />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </>
  );
};
