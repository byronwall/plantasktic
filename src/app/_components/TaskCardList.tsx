"use client";

import { useState } from "react";

import { Checkbox } from "~/components/ui/checkbox";

import { useTaskColumns } from "./hooks/useTaskColumns";
import {
  COLUMN_PRESETS,
  type ColumnKey,
  ColumnSelector,
} from "./tables/ColumnSelector";
import { TaskActions } from "./TaskActions";
import { TaskField } from "./TaskField";

import type { Task } from "@prisma/client";

interface TaskCardListProps {
  tasks: Task[];
  selectedTasks: Set<number>;
  onToggleSelect: (taskIds: number[]) => void;
}

export function TaskCardList({
  tasks,
  selectedTasks,
  onToggleSelect,
}: TaskCardListProps) {
  const { AVAILABLE_COLUMNS } = useTaskColumns();
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([
    ...COLUMN_PRESETS.detailed.columns,
  ]);

  const handleColumnToggle = (columns: ColumnKey[]) => {
    // Ensure at least one column is selected
    if (columns.length === 0) {
      columns = ["title" as const];
    }
    setSelectedColumns(columns);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ColumnSelector
          selectedColumns={selectedColumns}
          onColumnToggle={handleColumnToggle}
          availableColumns={AVAILABLE_COLUMNS}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <div
            key={task.task_id}
            className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <Checkbox
                checked={selectedTasks.has(task.task_id)}
                onCheckedChange={() => onToggleSelect([task.task_id])}
              />
              <TaskActions task={task} />
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 flex-col gap-2">
                  {selectedColumns.map((field) => (
                    <TaskField
                      key={field}
                      task={task}
                      field={field as keyof Task}
                      showLabel={true}
                      className="flex items-center"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
