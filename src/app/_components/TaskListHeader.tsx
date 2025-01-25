import {
  BarChart3,
  ChevronDown,
  GanttChart,
  Grid2X2,
  KanbanSquare,
  LayoutGrid,
  ListIcon,
  Settings,
  TableIcon,
} from "lucide-react";

import { ColorPalettePicker } from "~/components/ColorPalettePicker";
import { SimpleTooltip } from "~/components/SimpleTooltip";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { useViewSettingsStore } from "~/stores/useViewSettingsStore";

import { ComboBox } from "./ComboBox";
import { ProjectSelector } from "./ProjectSelector";

type TaskListHeaderProps = {
  selectedTasks: Set<number>;
  onBulkDelete: () => void;
  onBulkCategoryUpdate: (category: string) => void;
  onBulkMoveToProject: (projectId: string | null) => void;
  categories: string[];
  totalTasks: number;
  onToggleSelectAll: () => void;
};

export function TaskListHeader({
  selectedTasks,
  onBulkDelete,
  onBulkCategoryUpdate,
  onBulkMoveToProject,
  categories,
  totalTasks,
  onToggleSelectAll,
}: TaskListHeaderProps) {
  const {
    showCompleted,
    showFieldNames,
    setShowCompleted,
    setShowFieldNames,
    viewMode,
    setViewMode,
  } = useViewSettingsStore();

  return (
    <div className="flex h-8 w-full items-center justify-between gap-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedTasks.size === totalTasks && totalTasks > 0}
            onCheckedChange={onToggleSelectAll}
          />
          <span className="text-sm">Select All</span>
        </div>
        {selectedTasks.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm">{selectedTasks.size} selected</span>
            <Button variant="destructive" size="sm" onClick={onBulkDelete}>
              Delete Selected
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Set Category
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <ComboBox
                  options={categories}
                  value=""
                  onChange={(value) => onBulkCategoryUpdate(value ?? "")}
                  placeholder="Select category..."
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Move to Project
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <ProjectSelector onProjectSelect={onBulkMoveToProject} />
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
