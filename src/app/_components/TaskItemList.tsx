import { Checkbox } from "~/components/ui/checkbox";
import { api } from "~/trpc/react";

import { TaskItem } from "./TaskItem";
import { type Task } from "./TaskList";

export function TaskItemList({
  tasks,
  selectedTasks,
  toggleTaskSelection,
}: {
  tasks: Task[];
  selectedTasks: Set<number>;
  toggleTaskSelection: (taskId: number) => void;
}) {
  const moveTaskToProjectMutation = api.task.moveTaskToProject.useMutation();

  const toggleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      toggleTaskSelection(-1); // signal to clear
    } else {
      tasks.forEach((t) => toggleTaskSelection(t.task_id));
    }
  };

  const handleMoveToProject = async (
    taskId: number,
    projectId: string | null,
  ) => {
    await moveTaskToProjectMutation.mutateAsync({ taskId, projectId });
  };

  return (
    <div className="w-full rounded-lg border bg-card shadow">
      <div className="flex flex-col items-center">
        <div className="flex w-full items-center border-b border-gray-200 px-4 py-2">
          <Checkbox
            checked={selectedTasks.size === tasks.length}
            onCheckedChange={toggleSelectAll}
            className="h-5 w-5"
          />
          <div className="flex flex-1 items-center gap-2">
            <span className="ml-2 text-sm font-medium">Title</span>
            <div className="flex-grow" />
            <span className="mr-24 text-sm font-medium">Category</span>
          </div>
          <div className="w-[160px]" />
        </div>
        {tasks.length === 0 ? (
          <div className="flex w-full items-center justify-center py-8 text-sm text-muted-foreground">
            No tasks found. Create a new task to get started.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.task_id}
              task={task}
              isSelected={selectedTasks.has(task.task_id)}
              onToggleSelect={toggleTaskSelection}
              onMoveToProject={handleMoveToProject}
            />
          ))
        )}
      </div>
    </div>
  );
}
