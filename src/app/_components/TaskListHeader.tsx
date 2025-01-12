import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";

import { ComboBox } from "./ComboBox";
import { ProjectSelector } from "./ProjectSelector";

type TaskListHeaderProps = {
  selectedTasks: Set<number>;
  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
  onBulkDelete: () => void;
  onBulkCategoryUpdate: (category: string) => void;
  onBulkMoveToProject: (projectId: string | null) => void;
  categories: string[];
};

export function TaskListHeader({
  selectedTasks,
  showCompleted,
  setShowCompleted,
  onBulkDelete,
  onBulkCategoryUpdate,
  onBulkMoveToProject,
  categories,
}: TaskListHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-4">
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
      <div className="flex items-center gap-2">
        <span className="text-sm">Show Completed Tasks</span>
        <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
      </div>
    </div>
  );
}
