import { Check, Copy, FolderInput, Trash2 } from "lucide-react";

import { SimpleTooltip } from "~/components/SimpleTooltip";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";

import { ProjectSelector } from "./ProjectSelector";

type TaskActionsProps = {
  taskId: number;
  status: string;
  projectId: string | null;
  copiedTaskId: number | null;
  onCopy: (taskId: number) => void;
  onDelete: (taskId: number, e: React.MouseEvent) => void;
  onStatusChange: (taskId: number, status: string) => void;
  onMoveToProject: (taskId: number, projectId: string | null) => void;
};

export function TaskActions({
  taskId,
  status,
  projectId,
  copiedTaskId,
  onCopy,
  onDelete,
  onStatusChange,
  onMoveToProject,
}: TaskActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <SimpleTooltip content="Move to project">
        <Popover>
          <PopoverTrigger asChild>
            <SimpleTooltip content="Move to project">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <FolderInput className="h-4 w-4" />
              </Button>
            </SimpleTooltip>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="end">
            <ProjectSelector
              currentProjectId={projectId}
              onProjectSelect={(projectId) =>
                onMoveToProject(taskId, projectId)
              }
            />
          </PopoverContent>
        </Popover>
      </SimpleTooltip>

      <SimpleTooltip content="Copy task">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(taskId);
          }}
          className="h-8 w-8 transition-opacity"
          disabled={copiedTaskId === taskId}
        >
          {copiedTaskId === taskId ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </SimpleTooltip>

      <SimpleTooltip content="Delete task">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(taskId, e);
          }}
          className="h-8 w-8 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </SimpleTooltip>

      <SimpleTooltip content="Toggle completion">
        <div>
          <Switch
            checked={status === "completed"}
            onCheckedChange={() => onStatusChange(taskId, status)}
          />
        </div>
      </SimpleTooltip>
    </div>
  );
}
