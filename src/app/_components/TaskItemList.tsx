import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { api } from "~/trpc/react";

import {
  COLUMN_PRESETS,
  type ColumnKey,
  ColumnSelector,
  type PresetKey,
} from "./tables/ColumnSelector";
import { TaskItem } from "./TaskItem";
import { type Task } from "./TaskList";

const AVAILABLE_COLUMNS = [
  { value: "title", label: "Title" },
  { value: "category", label: "Category" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "description", label: "Description" },
  { value: "comments", label: "Comments" },
  { value: "due_date", label: "Due Date" },
  { value: "start_date", label: "Start Date" },
  { value: "duration", label: "Duration" },
  { value: "created_at", label: "Created At" },
  { value: "updated_at", label: "Updated At" },
];

export function TaskItemList({
  tasks,
  selectedTasks,
  toggleTaskSelection,
}: {
  tasks: Task[];
  selectedTasks: Set<number>;
  toggleTaskSelection: (taskId: number) => void;
}) {
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([
    ...COLUMN_PRESETS.basic.columns,
  ]);

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

  const handlePresetClick = (preset: PresetKey) => {
    setSelectedColumns([...COLUMN_PRESETS[preset].columns]);
  };

  const handleColumnToggle = (columns: ColumnKey[]) => {
    // Ensure at least one column is selected
    if (columns.length === 0) {
      columns = ["title" as const];
    }
    setSelectedColumns(columns);
  };

  return (
    <div className="w-full rounded-lg border bg-card shadow">
      <div className="flex flex-col items-center">
        <div className="mb-4 w-full space-y-2 border-b p-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(COLUMN_PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(key as PresetKey)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <ColumnSelector
            selectedColumns={selectedColumns}
            onColumnToggle={handleColumnToggle}
            availableColumns={AVAILABLE_COLUMNS}
          />
        </div>
        <div className="flex w-full items-center border-b border-gray-200 px-4 py-2">
          <Checkbox
            checked={selectedTasks.size === tasks.length}
            onCheckedChange={toggleSelectAll}
            className="h-5 w-5"
          />
          <div className="flex flex-1 items-center gap-2">
            <span className="ml-2 text-sm font-medium">Title</span>
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
              selectedColumns={selectedColumns}
              onToggleSelect={toggleTaskSelection}
              onMoveToProject={handleMoveToProject}
            />
          ))
        )}
      </div>
    </div>
  );
}
