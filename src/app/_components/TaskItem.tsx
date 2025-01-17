import { Checkbox } from "~/components/ui/checkbox";

import { CreateChildTaskDialog } from "./CreateChildTaskDialog";
import { TaskActions } from "./TaskActions";
import { TaskField } from "./TaskField";
import { type Task } from "./TaskList";

export function TaskItem({
  task,
  isSelected,
  selectedColumns,
  onToggleSelect,
  showFieldNames,
  indentLevel = 0,
}: {
  task: Task;
  isSelected: boolean;
  selectedColumns: string[];
  onToggleSelect: (taskIds: number[]) => void;
  showFieldNames: boolean;
  indentLevel?: number;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg border px-2"
      style={{ marginLeft: `${indentLevel * 20}px` }}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect([task.task_id])}
          />
          <CreateChildTaskDialog
            parentTaskId={task.task_id}
            projectId={task.projectId}
          />
        </div>
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
