import { Checkbox } from "~/components/ui/checkbox";

import { TaskActions } from "./TaskActions";
import { TaskField } from "./TaskField";
import { type Task } from "./TaskList";

export function TaskItem({
  task,
  isSelected,
  selectedColumns,
  onToggleSelect,
  showFieldNames,
}: {
  task: Task;
  isSelected: boolean;
  selectedColumns: string[];
  onToggleSelect: (taskIds: number[]) => void;
  showFieldNames: boolean;
}) {
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

      <TaskActions task={task} />
    </div>
  );
}
