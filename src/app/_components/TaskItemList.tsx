import { useState } from "react";

import { Checkbox } from "~/components/ui/checkbox";

import { useTaskColumns } from "./hooks/useTaskColumns";
import {
  COLUMN_PRESETS,
  type ColumnKey,
  ColumnSelector,
  type PresetKey,
} from "./tables/ColumnSelector";
import { TaskItem } from "./TaskItem";
import { type Task } from "./TaskList";

export function TaskItemList({
  tasks,
  selectedTasks,
  onToggleSelect,
  onMoveToProject,
  showFieldNames,
}: {
  tasks: Task[];
  selectedTasks: Set<number>;
  onToggleSelect: (taskIds: number[]) => void;
  onMoveToProject: (taskId: number, projectId: string | null) => void;
  showFieldNames: boolean;
}) {
  const { AVAILABLE_COLUMNS } = useTaskColumns();
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([
    ...COLUMN_PRESETS.basic.columns,
  ]);

  const toggleSelectAll = () => {
    const allTaskIds = tasks.map((t) => t.task_id);
    const isAllSelected = allTaskIds.every((id) => selectedTasks.has(id));

    if (isAllSelected) {
      onToggleSelect([-1]); // signal to clear
    } else {
      // Select all tasks that aren't currently selected
      const unselectedTasks = allTaskIds.filter((id) => !selectedTasks.has(id));
      onToggleSelect(unselectedTasks);
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
