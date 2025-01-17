import { useState } from "react";

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
  showFieldNames,
}: {
  tasks: Task[];
  selectedTasks: Set<number>;
  onToggleSelect: (taskIds: number[]) => void;
  showFieldNames: boolean;
}) {
  const { AVAILABLE_COLUMNS } = useTaskColumns();
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([
    ...COLUMN_PRESETS.basic.columns,
  ]);

  const handlePresetClick = (preset: PresetKey) => {
    setSelectedColumns([...COLUMN_PRESETS[preset].columns]);
  };

  const handleColumnToggle = (columns: ColumnKey[]) => {
    setSelectedColumns(columns);
  };

  return (
    <>
      <div className="flex items-center justify-end">
        <ColumnSelector
          availableColumns={AVAILABLE_COLUMNS}
          selectedColumns={selectedColumns}
          onColumnToggle={handleColumnToggle}
          onPresetClick={handlePresetClick}
        />
      </div>
      <div className="flex w-fit max-w-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.task_id}
              task={task}
              isSelected={selectedTasks.has(task.task_id)}
              selectedColumns={selectedColumns}
              onToggleSelect={onToggleSelect}
              showFieldNames={showFieldNames}
            />
          ))}
        </div>
      </div>
    </>
  );
}
