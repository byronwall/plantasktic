import { useState } from "react";

import { Checkbox } from "~/components/ui/checkbox";

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
  onToggleSelect,
  onMoveToProject,
  showFieldNames,
}: {
  tasks: Task[];
  selectedTasks: Set<number>;
  onToggleSelect: (taskId: number) => void;
  onMoveToProject: (taskId: number, projectId: string | null) => void;
  showFieldNames: boolean;
}) {
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([
    ...COLUMN_PRESETS.basic.columns,
  ]);

  const toggleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      onToggleSelect(-1); // signal to clear
    } else {
      tasks.forEach((t) => onToggleSelect(t.task_id));
    }
  };

  const handlePresetClick = (preset: PresetKey) => {
    setSelectedColumns([...COLUMN_PRESETS[preset].columns]);
  };

  const handleColumnToggle = (columns: ColumnKey[]) => {
    setSelectedColumns(columns);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedTasks.size === tasks.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm">Select All</span>
        </div>
        <ColumnSelector
          availableColumns={AVAILABLE_COLUMNS}
          selectedColumns={selectedColumns}
          onColumnToggle={handleColumnToggle}
          onPresetClick={handlePresetClick}
        />
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskItem
            key={task.task_id}
            task={task}
            isSelected={selectedTasks.has(task.task_id)}
            selectedColumns={selectedColumns}
            onToggleSelect={onToggleSelect}
            onMoveToProject={onMoveToProject}
            showFieldNames={showFieldNames}
          />
        ))}
      </div>
    </div>
  );
}
