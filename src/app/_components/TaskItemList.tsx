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

type TaskWithChildren = Task & { children?: TaskWithChildren[] };

function organizeTaskHierarchy(tasks: Task[]): TaskWithChildren[] {
  const taskMap = new Map<number, TaskWithChildren>();
  const rootTasks: TaskWithChildren[] = [];

  // First pass: create all task objects and store in map
  tasks.forEach((task) => {
    taskMap.set(task.task_id, { ...task });
  });

  // Second pass: organize into hierarchy
  tasks.forEach((task) => {
    const taskWithChildren = taskMap.get(task.task_id)!;
    if (task.parentTaskId) {
      const parent = taskMap.get(task.parentTaskId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(taskWithChildren);
      } else {
        rootTasks.push(taskWithChildren);
      }
    } else {
      rootTasks.push(taskWithChildren);
    }
  });

  return rootTasks;
}

function renderTaskHierarchy(
  tasks: TaskWithChildren[],
  selectedTasks: Set<number>,
  onToggleSelect: (taskIds: number[]) => void,
  showFieldNames: boolean,
  selectedColumns: ColumnKey[],
  level = 0,
): JSX.Element[] {
  return tasks.flatMap((task) => [
    <TaskItem
      key={task.task_id}
      task={task}
      isSelected={selectedTasks.has(task.task_id)}
      selectedColumns={selectedColumns}
      onToggleSelect={onToggleSelect}
      showFieldNames={showFieldNames}
      indentLevel={level}
    />,
    ...(task.children
      ? renderTaskHierarchy(
          task.children,
          selectedTasks,
          onToggleSelect,
          showFieldNames,
          selectedColumns,
          level + 1,
        )
      : []),
  ]);
}

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

  const organizedTasks = organizeTaskHierarchy(tasks);

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
          {renderTaskHierarchy(
            organizedTasks,
            selectedTasks,
            onToggleSelect,
            showFieldNames,
            selectedColumns,
          )}
        </div>
      </div>
    </>
  );
}
