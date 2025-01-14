import { Checkbox } from "~/components/ui/checkbox";

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
  onToggleSelect: (taskId: number) => void;
  onMoveToProject: (taskId: number, projectId: string | null) => void;
  showFieldNames: boolean;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border p-4">
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggleSelect(task.task_id)}
      />
      <div className="flex flex-col gap-2">
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
  );
}
