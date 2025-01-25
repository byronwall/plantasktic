import {
  BarChart3,
  ChevronDown,
  FolderInput,
  GanttChart,
  Grid2X2,
  KanbanSquare,
  LayoutGrid,
  ListIcon,
  Settings,
  TableIcon,
  Tag,
  Trash2,
} from "lucide-react";

import { ColorPalettePicker } from "~/components/ColorPalettePicker";
import { SimpleTooltip } from "~/components/SimpleTooltip";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { useSelectedTasksStore } from "~/stores/useSelectedTasksStore";
import { useViewSettingsStore } from "~/stores/useViewSettingsStore";
import { api } from "~/trpc/react";

import { ComboBox } from "./ComboBox";
import { ProjectSelector } from "./ProjectSelector";

type TaskListHeaderProps = {
  totalTasks: number;
};

export function TaskListHeader({ totalTasks }: TaskListHeaderProps) {
  const {
    showCompleted,
    showFieldNames,
    setShowCompleted,
    setShowFieldNames,
    viewMode,
    setViewMode,
  } = useViewSettingsStore();

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
    <div className="flex h-8 w-full items-center justify-between gap-2">
      <div className="flex items-center gap-4">
        <Label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            className="h-5 w-5"
            checked={selectedTasks.size === totalTasks && totalTasks > 0}
            onCheckedChange={() => {
              toggleAllTasks(
                Array.from({ length: totalTasks }, (_, i) => i + 1),
              );
            }}
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
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <SimpleTooltip content="Summary View">
            <Button
              variant={viewMode === "summary" ? "default" : "outline"}
              onClick={() => setViewMode("summary")}
              size="sm"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="List View">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              size="sm"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Table View">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => setViewMode("table")}
              size="sm"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Card View">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              onClick={() => setViewMode("card")}
              size="sm"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Kanban View">
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              onClick={() => setViewMode("kanban")}
              size="sm"
            >
              <KanbanSquare className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Gantt View">
            <Button
              variant={viewMode === "gantt" ? "default" : "outline"}
              onClick={() => setViewMode("gantt")}
              size="sm"
            >
              <GanttChart className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Matrix View">
            <Button
              variant={viewMode === "matrix" ? "default" : "outline"}
              onClick={() => setViewMode("matrix")}
              size="sm"
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
        </div>
        <div className="flex items-center gap-2">
          <ColorPalettePicker />

          <Popover>
            <SimpleTooltip content="View Settings">
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </SimpleTooltip>
            <PopoverContent className="w-[200px]">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Field Names</span>
                  <Switch
                    checked={showFieldNames}
                    onCheckedChange={setShowFieldNames}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Completed Tasks</span>
                  <Switch
                    checked={showCompleted}
                    onCheckedChange={setShowCompleted}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
