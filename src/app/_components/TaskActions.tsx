import { Check, Copy, Edit2, FolderInput, Trash2 } from "lucide-react";
import { useState } from "react";

import { SimpleTooltip } from "~/components/SimpleTooltip";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { useEditTaskStore } from "~/stores/useEditTaskStore";
import { api } from "~/trpc/react";

import { ProjectSelector } from "./ProjectSelector";

import type { Task } from "./TaskList";

type TaskActionsProps = {
  task: Task;
};

export function TaskActions({ task }: TaskActionsProps) {
  const [copiedTaskId, setCopiedTaskId] = useState<number | null>(null);
  const updateTask = api.task.updateTask.useMutation();
  const deleteTaskMutation = api.task.deleteTask.useMutation();
  const bulkMoveTasksToProjectMutation =
    api.task.bulkMoveTasksToProject.useMutation();
  const openEditDialog = useEditTaskStore((state) => state.open);

  const copyToClipboard = (taskId: number, title: string) => {
    void navigator.clipboard.writeText(title);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  const toggleTaskStatus = (taskId: number, status: string) => {
    const newStatus = status === "completed" ? "open" : "completed";
    void updateTask.mutateAsync({
      taskId,
      data: { status: newStatus },
    });
  };

  const handleDelete = async (taskId: number, e: React.MouseEvent) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const skipConfirm = (isMac && e.metaKey) || (!isMac && e.ctrlKey);

    if (
      skipConfirm ||
      window.confirm("Are you sure you want to delete this task?")
    ) {
      await deleteTaskMutation.mutateAsync({ taskId });
    }
  };

  const handleMoveToProject = async (
    taskId: number,
    projectId: string | null,
  ) => {
    await bulkMoveTasksToProjectMutation.mutateAsync({
      taskIds: [taskId],
      projectId,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <SimpleTooltip content="Edit task">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            openEditDialog(task);
          }}
          className="h-8 w-8"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </SimpleTooltip>

      <Popover>
        <SimpleTooltip content="Move to project">
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <FolderInput className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </SimpleTooltip>
        <PopoverContent className="w-[200px] p-0" align="end">
          <ProjectSelector
            currentProjectId={task.projectId}
            onProjectSelect={(projectId) =>
              handleMoveToProject(task.task_id, projectId)
            }
          />
        </PopoverContent>
      </Popover>

      <SimpleTooltip content="Copy task">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(task.task_id, task.title);
          }}
          className="h-8 w-8 transition-opacity"
          disabled={copiedTaskId === task.task_id}
        >
          {copiedTaskId === task.task_id ? (
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
            void handleDelete(task.task_id, e);
          }}
          className="h-8 w-8 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </SimpleTooltip>

      <SimpleTooltip content="Toggle completion">
        <div>
          <Switch
            checked={task.status === "completed"}
            onCheckedChange={() => toggleTaskStatus(task.task_id, task.status)}
          />
        </div>
      </SimpleTooltip>
    </div>
  );
}
