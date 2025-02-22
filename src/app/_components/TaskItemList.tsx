import { useState } from "react";

import { useTaskColumns } from "./hooks/useTaskColumns";
import {
  COLUMN_PRESETS,
  type ColumnKey,
  ColumnSelector,
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
  showFieldNames: boolean,
  selectedColumns: ColumnKey[],
  level = 0,
): JSX.Element[] {
  return tasks.flatMap((task) => [
    <TaskItem
      key={task.task_id}
      task={task}
      selectedColumns={selectedColumns}
      showFieldNames={false}
      indentLevel={level}
    />,
    ...(task.children
      ? renderTaskHierarchy(
          task.children,
          showFieldNames,
          selectedColumns,
          level + 1,
        )
      : []),
  ]);
}

export function TaskItemList({
  tasks,
  showFieldNames,
}: {
  tasks: Task[];
  showFieldNames: boolean;
}) {
  const { AVAILABLE_COLUMNS } = useTaskColumns();
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([
    ...COLUMN_PRESETS.basic.columns,
  ]);

  const handleColumnToggle = (columns: ColumnKey[]) => {
    setSelectedColumns(columns);
  };

  const organizedTasks = organizeTaskHierarchy(tasks);

  const totalColumns = 2 + selectedColumns.length + 1;

  return (
    <div className="flex w-full flex-col gap-4">
      <ColumnSelector
        availableColumns={AVAILABLE_COLUMNS}
        selectedColumns={selectedColumns}
        onColumnToggle={handleColumnToggle}
      />

      <div className="w-full overflow-x-auto">
        <div
          className="gap-1"
          style={{
            display: "grid",
            gridTemplateColumns: `auto repeat(${totalColumns - 1}, auto)`,
            gridAutoColumns: "auto",
            grid: "subgrid",
          }}
        >
          <div className="col-span-full grid grid-cols-subgrid bg-white text-center text-sm font-semibold">
            <div></div>
            <div></div>
            {selectedColumns.map((column) => (
              <div key={column}>
                {AVAILABLE_COLUMNS.find((col) => col.value === column)?.label ??
                  column}
              </div>
            ))}
            <div>Actions</div>
          </div>

          {renderTaskHierarchy(organizedTasks, showFieldNames, selectedColumns)}
        </div>
      </div>
    </div>
  );
}
