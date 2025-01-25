import { ColorPalettePicker } from "~/components/ColorPalettePicker";
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
  const { showCompleted, showFieldNames, setShowCompleted, setShowFieldNames } =
    useViewSettingsStore();

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
        <ColorPalettePicker />
        <div className="flex items-center gap-2">
          <span className="text-sm">Show Field Names</span>
          <Switch
            checked={showFieldNames}
            onCheckedChange={setShowFieldNames}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Show Completed Tasks</span>
          <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
        </div>
      </div>
    </div>
  );
}
