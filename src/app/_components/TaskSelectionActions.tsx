import {
  ChevronDown,
  FolderInput,
  PlusCircle,
  Tag,
  Trash2,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { useSelectedTasksStore } from "~/stores/useSelectedTasksStore";
import { api } from "~/trpc/react";

type TaskSelectionActionsProps = {
  totalTasks: number;
};

export const TaskSelectionActions = ({
  totalTasks,
}: TaskSelectionActionsProps) => {
  const { selectedTasks, toggleAllTasks, clearSelection } =
    useSelectedTasksStore();

  const { data: categories = [] } = api.task.getCategories.useQuery();

  const { workspaceProjects } = useCurrentProject();

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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            className="h-5 w-5"
            checked={selectedTasks.size === totalTasks && totalTasks > 0}
            onCheckedChange={() => toggleAllTasks()}
          />
          <span className="select-none text-sm">
            {selectedTasks.size > 0
              ? `${selectedTasks.size} selected`
              : "Select All"}
          </span>
        </Label>
      </div>
      {selectedTasks.size > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleBulkDelete}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Tag className="mr-2 h-4 w-4" />
                Set Category
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleBulkCategoryUpdate("")}>
                  <span className="mr-2">None</span>
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => handleBulkCategoryUpdate(category)}
                  >
                    <span className="mr-2">{category}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const newCategory = window.prompt("Enter new category:");
                    if (newCategory) {
                      void handleBulkCategoryUpdate(newCategory);
                    }
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Category
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput className="mr-2 h-4 w-4" />
                Move to Project
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {workspaceProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleBulkMoveToProject(project.id)}
                  >
                    <span className="mr-2">{project.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
