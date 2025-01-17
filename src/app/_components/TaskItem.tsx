import { useState } from "react";

import { Checkbox } from "~/components/ui/checkbox";
import { api } from "~/trpc/react";

import { TaskActions } from "./TaskActions";
import { TaskField } from "./TaskField";
import { type Task } from "./TaskList";

export function TaskItem({
  task,
  isSelected,
  selectedColumns,
  onToggleSelect,
  onMoveToProject,
  showFieldNames,
}: {
  task: Task;
  isSelected: boolean;
  selectedColumns: string[];
  onToggleSelect: (taskIds: number[]) => void;
  onMoveToProject: (taskId: number, projectId: string | null) => void;
  showFieldNames: boolean;
}) {
  const [copiedTaskId, setCopiedTaskId] = useState<number | null>(null);
  const updateTask = api.task.updateTask.useMutation();
  const deleteTaskMutation = api.task.deleteTask.useMutation();

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

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border px-2">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect([task.task_id])}
        />
        <div className="flex flex-1 gap-2">
          {selectedColumns.map((field) => (
            <TaskField
              key={field}
              task={task}
              field={field as keyof Task}
              showLabel={showFieldNames}
              className="flex items-center"
            />
          ))}
        </div>
      </div>

      <TaskActions
        task={task}
        copiedTaskId={copiedTaskId}
        onCopy={(taskId) => copyToClipboard(taskId, task.title)}
        onDelete={handleDelete}
        onStatusChange={toggleTaskStatus}
        onMoveToProject={onMoveToProject}
      />
    </div>
  );
}
